import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import { useWallet } from './WalletContext';
import { useAuth } from './AuthContext';
import contractAPI from '../services/contractAPI';
import invoiceAPI from '../services/invoiceAPI';

const InvoiceContext = createContext();

export const useInvoice = () => {
  const context = useContext(InvoiceContext);
  if (!context) {
    throw new Error('useInvoice must be used within an InvoiceProvider');
  }
  return context;
};

export const InvoiceProvider = ({ children }) => {
  const { signer, account } = useWallet();
  // Include idToken so we can gate protected searches until token is ready
  const { user: authUser, authReady, idToken } = useAuth();
  const [userInvoices, setUserInvoices] = useState([]);
  const [sentInvoices, setSentInvoices] = useState([]);
  const [receivedInvoices, setReceivedInvoices] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [contract, setContract] = useState(null);
  const [lastLoadTime, setLastLoadTime] = useState(0);
  const [autoVerifyAttempted, setAutoVerifyAttempted] = useState(false);
  const [pendingLoad, setPendingLoad] = useState(false); // set when we skipped due to missing token
  // Enforce on-chain execution (previous dev skip removed). If env still set, warn once.
  const devSkipEnv = (process.env.REACT_APP_DEV_SKIP_ONCHAIN || '').toLowerCase() === 'true';
  useEffect(() => {
    if (devSkipEnv) {
      console.warn('[InvoiceContext] REACT_APP_DEV_SKIP_ONCHAIN is set but skip mode is disabled. All invoices will be created on-chain. Remove the env var to silence this.');
    }
  }, [devSkipEnv]);

  // Rate limiting: prevent API calls more frequent than once per 5 seconds
  const MIN_LOAD_INTERVAL = 5000;

  // Load contract
  useEffect(() => {
    const loadContract = async () => {
      if (signer) {
        try {
          // Some bundlers (prod builds) wrap JSON under .default; support both shapes
          const mod = await import('../contracts/InvoiceManager.json');
          const contractData = mod?.default || mod;
          if (!contractData?.address || !contractData?.abi) {
            throw new Error('Invalid contract artifact: missing address or abi');
          }
          const contractInstance = new ethers.Contract(
            contractData.address,
            contractData.abi,
            signer
          );
          setContract(contractInstance);
        } catch (error) {
          console.error('Failed to load contract:', error);
        }
      }
    };

    loadContract();
  }, [signer]);

  // Load user data and invoices from MongoDB
  const loadUserInvoices = useCallback(async (opts = {}) => {
    const { force = false } = opts;
    if (!account) return;

    // If a Firebase user exists but token not yet ready, defer
    if (authUser && !idToken) {
      if (process.env.REACT_APP_DEBUG_AUTH === 'true') {
        console.info('[InvoiceContext] Skipping invoice search until idToken ready');
      }
      setPendingLoad(true);
      return;
    }

    // Rate limiting: check if enough time has passed since last load
    const now = Date.now();
    if (!force && (now - lastLoadTime < MIN_LOAD_INTERVAL)) {
      if (process.env.REACT_APP_DEBUG_AUTH === 'true') {
        console.info('[InvoiceContext] Rate limited: skipping API call');
      }
      return;
    }

    setLoading(true);
    setLastLoadTime(now);
    try {
      // Step 1: ensure user exists (public endpoint)
      const userResponse = await invoiceAPI.createOrGetUser({
        walletAddress: account,
        name: authUser?.displayName,
        email: authUser?.email,
      });
      if (userResponse.user) setUserInfo(userResponse.user);

      // Step 2: only fetch invoices when we either have an idToken (authenticated)
      // or there is no authUser (edge dev case). If authUser exists but no token, we already returned earlier.
      if (!authUser || (authUser && idToken)) {
        try {
          const invoicesResponse = await invoiceAPI.getUserInvoices(account);
          if (invoicesResponse.results) {
            // Normalize status to a consistent numeric code for UI counters
            const mapStatusToNumeric = (status) => {
              if (typeof status !== 'string') return status; // already numeric or unexpected
              const s = status.toLowerCase();
              if (s === 'paid') return 1;
              if (s === 'disputed') return 2;
              if (s === 'resolved') return 3;
              if (s === 'cancelled') return 4;
              // treat draft / pending / overdue / created / unknown as Created (0)
              return 0;
            };
            const normalized = invoicesResponse.results.map(inv => ({
              ...inv,
              _rawStatus: inv.status,
              status: mapStatusToNumeric(inv.status)
            }));
            setUserInvoices(normalized);
            if (account) {
              const lower = account.toLowerCase();
              setSentInvoices(normalized.filter(i => i.issuer?.walletAddress === lower));
              setReceivedInvoices(normalized.filter(i => i.recipient?.walletAddress === lower));
            }
          } else {
            setUserInvoices([]);
            setSentInvoices([]);
            setReceivedInvoices([]);
          }
        } catch (invErr) {
          // Handle 401 silently if token race still occurred
          if (invErr.message?.includes('Unauthorized')) {
            if (process.env.REACT_APP_DEBUG_AUTH === 'true') {
              console.warn('[InvoiceContext] Invoice search unauthorized (likely token race), will retry later');
            }
          } else if (!invErr.message?.includes('Network error') && !invErr.message?.includes('Rate limit')) {
            console.error('Failed to load invoices:', invErr.message);
          }
          setUserInvoices([]);
        }
      }
    } catch (error) {
      if (!error.message?.includes('Network error') && !error.message?.includes('Rate limit')) {
        console.error('Failed to load user data:', error.message);
      }
      if (error.message?.includes('Network error')) {
        // Suppress noisy network toasts
      } else if (!document.querySelector('.Toastify__toast--error')) {
        toast.error('Failed to load invoices: ' + error.message);
      }
      setUserInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [account, lastLoadTime, authUser, idToken]);


  // Verify wallet ownership by signing a nonce from the server
  const verifyWalletOwnership = useCallback(async () => {
    if (!account || !signer) {
      toast.error('Connect your wallet first');
      return false;
    }
    try {
      const { nonce } = await invoiceAPI.requestWalletNonce(account);
      if (!nonce) throw new Error('No nonce received');
      const message = `Verify ownership of ${account}\nNonce: ${nonce}`;
      const signature = await signer.signMessage(message);
      const resp = await invoiceAPI.verifyWalletSignature(account, signature);
      if (resp?.success) {
        // Refresh user profile
        const refreshed = await invoiceAPI.createOrGetUser({ walletAddress: account });
        if (refreshed.user) setUserInfo(refreshed.user);
        return true;
      }
      throw new Error(resp?.error || 'Verification failed');
    } catch (e) {
      console.error('Wallet verification failed:', e);
      toast.error(e.message || 'Wallet verification failed');
      return false;
    }
  }, [account, signer]);

  // Auto-verify: after Firebase login and when wallet is connected, attempt one-time verification if not verified
  useEffect(() => {
    if (authUser && account && signer && userInfo && !userInfo.verifiedWallet && !autoVerifyAttempted) {
      setAutoVerifyAttempted(true);
      // Attempt in background; toasts are handled inside
      verifyWalletOwnership();
    }
  }, [authUser, account, signer, userInfo, autoVerifyAttempted, verifyWalletOwnership]);

  // Reset the attempt flag on logout so we can try again next time
  useEffect(() => {
    if (!authUser) setAutoVerifyAttempted(false);
  }, [authUser]);

  // Create invoice with MongoDB and blockchain
  const createInvoice = async (invoiceData) => {
    if (!contract || !signer || !account) {
      throw new Error('Contract or wallet not available');
    }

    try {
      setLoading(true);

      // Use the complete invoice creation workflow
      const result = await invoiceAPI.createCompleteInvoice(
        invoiceData, 
        account, 
        userInfo
      );

  const { invoice, pdf, error } = result;
      
      // Handle partial success (metadata created but PDF upload failed)
      if (error) {
        // Store the invoice in our local state even if PDF failed
        setUserInvoices(prev => [invoice, ...prev]);
        toast.warning(error);
        setLoading(false);
        return { success: false, invoice, error };
      }
  // Extract upload details from server response
  const ipfsHash = pdf?.data?.ipfsHash || pdf?.ipfsHash;
  const downloadUrl = pdf?.data?.downloadUrl || pdf?.downloadUrl;
  const storage = pdf?.data?.storage || 'unknown';
      if (!ipfsHash) {
        throw new Error('Failed to upload PDF to IPFS');
      }

  // Normalize and validate fields for on-chain call (or skip when dev flag is set)
      // Due date
      const dueTimestamp = Math.floor(new Date(invoiceData.dueDate).getTime() / 1000);
      const nowSec = Math.floor(Date.now() / 1000);
      if (!Number.isFinite(dueTimestamp) || dueTimestamp <= nowSec + 60) {
        throw new Error('Due date must be in the future');
      }

      // Recipient address
      let recipientAddress = null;
      if (typeof invoiceData.recipient === 'string' && invoiceData.recipient.trim()) {
        recipientAddress = invoiceData.recipient.trim();
      } else if (invoiceData.recipient && typeof invoiceData.recipient === 'object' && invoiceData.recipient.walletAddress) {
        recipientAddress = String(invoiceData.recipient.walletAddress).trim();
      } else if (invoiceData.recipientAddress) {
        recipientAddress = String(invoiceData.recipientAddress).trim();
      }
      if (!recipientAddress || !ethers.utils.isAddress(recipientAddress)) {
        throw new Error('Invalid recipient address');
      }
      if (recipientAddress.toLowerCase() === account.toLowerCase()) {
        throw new Error('Cannot invoice yourself');
      }

      // Amount
      let amountWei;
      try {
        amountWei = ethers.utils.parseEther(String(invoiceData.amount));
      } catch {
        throw new Error('Invalid amount');
      }

      // Token address (default ETH)
      let tokenAddr = invoiceData.tokenAddress;
      if (tokenAddr && String(tokenAddr).trim()) {
        if (!ethers.utils.isAddress(tokenAddr)) {
          throw new Error('Invalid token address');
        }
      } else {
        tokenAddr = ethers.constants.AddressZero;
      }

      // Create invoice on blockchain (normal path)
      const tx = await contract.createInvoice(
        ipfsHash,
        recipientAddress,
        amountWei,
        tokenAddr,
        dueTimestamp,
        invoiceData.description || ''
      );

      toast.info('Transaction submitted. Waiting for confirmation...');
      const receipt = await tx.wait();

      // Get the invoice ID from the event
      const event = receipt.events?.find(e => e.event === 'InvoiceCreated');
      const blockchainInvoiceId = event?.args?.id?.toString();

      // Update the invoice in MongoDB with blockchain transaction details
      if (blockchainInvoiceId) {
        await invoiceAPI.updateInvoiceStatus(invoice.invoiceId, {
          status: 'pending',
          transactionHash: receipt.transactionHash,
          blockNumber: receipt.blockNumber,
          blockchainInvoiceId: Number(blockchainInvoiceId)
        });
      }

      toast.success('Invoice created successfully!');
      
      // Reload user invoices
      await loadUserInvoices();

      return {
        success: true,
        invoiceId: blockchainInvoiceId,
        mongoId: invoice._id,
        txHash: receipt.transactionHash,
        ipfsHash,
        downloadUrl,
        storage
      };
    } catch (error) {
      const reason = error?.error?.message || error?.data?.message || error?.reason || error?.message || 'Transaction failed';
      console.error('Failed to create invoice:', error);
      toast.error('Failed to create invoice: ' + reason);
      throw new Error(reason);
    } finally {
      setLoading(false);
    }
  };

  // Pay invoice with ETH (also update MongoDB status)
  const payInvoiceETH = async (invoiceId, amount) => {
    if (!contract || !signer) {
      throw new Error('Contract not available');
    }

    try {
      setLoading(true);

      // Optional pre-flight status check to give clearer error than generic revert
      try {
        const onChain = await contract.getInvoice(invoiceId);
        // status enum: 0 Created, 1 Paid, 2 Disputed, 3 Resolved, 4 Cancelled
        const statusEnum = (typeof onChain.status === 'number')
          ? onChain.status
          : (onChain.status?.toNumber ? onChain.status.toNumber() : Number(onChain.status));
        if (Number.isFinite(statusEnum) && statusEnum !== 0) {
            const map = { 0: 'Created', 1: 'Paid', 2: 'Disputed', 3: 'Resolved', 4: 'Cancelled' };
          throw new Error(`Invoice status is ${map[statusEnum]}. Only 'Created' invoices can be paid.`);
        }
      } catch (prefetchErr) {
        if (prefetchErr.message && prefetchErr.message.startsWith('Invoice status is')) {
          toast.error(prefetchErr.message);
          throw prefetchErr;
        }
        // Ignore failures in preflight (e.g. method missing) and proceed
      }

      const tx = await contract.payInvoiceETH(invoiceId, {
        value: ethers.utils.parseEther(amount.toString())
      });

      toast.info('Payment submitted. Waiting for confirmation...');
      const receipt = await tx.wait();

      // Update status in MongoDB
      try {
        // Find the invoice by blockchain ID (server now supports blockchainId filter)
        const search = await invoiceAPI.searchInvoices({ walletAddress: account, blockchainId: invoiceId });
        const target = search.results && search.results[0];
        if (target) {
          // Update status using unified status endpoint
          await invoiceAPI.updateInvoiceStatus(target.invoiceId, {
            status: 'paid',
            transactionHash: receipt.transactionHash,
            blockchainInvoiceId: Number(invoiceId)
          });
        }
      } catch (dbError) {
        console.error('Failed to update invoice status in database:', dbError);
      }

      toast.success('Payment completed successfully!');
      
      // Reload user invoices
      await loadUserInvoices();

      return {
        success: true,
        txHash: receipt.transactionHash
      };
    } catch (error) {
      console.error('Failed to pay invoice:', error);
      toast.error('Failed to pay invoice: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Pay invoice with tokens
  const payInvoiceToken = async (invoiceId, tokenAddress, amount) => {
    if (!contract || !signer) {
      throw new Error('Contract not available');
    }

    try {
      setLoading(true);

      // First approve token spending
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ['function approve(address spender, uint256 amount) external returns (bool)'],
        signer
      );

      const approveTx = await tokenContract.approve(
        contract.address,
        ethers.utils.parseEther(amount.toString())
      );
      
      toast.info('Approving token spending...');
      await approveTx.wait();

      // Then pay the invoice
  const tx = await contract.payInvoiceToken(invoiceId);

      toast.info('Payment submitted. Waiting for confirmation...');
      const receipt = await tx.wait();

      // Update status in MongoDB
      try {
        const search = await invoiceAPI.searchInvoices({ walletAddress: account, blockchainId: invoiceId });
        const target = search.results && search.results[0];
        if (target) {
          await invoiceAPI.updateInvoiceStatus(target.invoiceId, {
            status: 'paid',
            transactionHash: receipt.transactionHash,
            blockchainInvoiceId: Number(invoiceId)
          });
        }
      } catch (dbError) {
        console.error('Failed to update invoice status in database (token):', dbError);
      }

      toast.success('Payment completed successfully!');
      await loadUserInvoices();

      return {
        success: true,
        txHash: receipt.transactionHash
      };
    } catch (error) {
      console.error('Failed to pay invoice:', error);
      toast.error('Failed to pay invoice: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Raise dispute
  const raiseDispute = async (invoiceId, reason) => {
    if (!contract || !signer) {
      throw new Error('Contract not available');
    }

    try {
      setLoading(true);

      // Get dispute fee
      const disputeFee = await contract.disputeFee();

      const tx = await contract.raiseDispute(invoiceId, reason, {
        value: disputeFee
      });

      toast.info('Dispute submitted. Waiting for confirmation...');
      const receipt = await tx.wait();

      toast.success('Dispute raised successfully!');
      
      // Reload user invoices
      await loadUserInvoices();

      return {
        success: true,
        txHash: receipt.transactionHash
      };
    } catch (error) {
      console.error('Failed to raise dispute:', error);
      toast.error('Failed to raise dispute: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Cancel invoice
  const cancelInvoice = async (invoiceId) => {
    if (!contract || !signer) {
      throw new Error('Contract not available');
    }

    try {
      setLoading(true);

      const tx = await contract.cancelInvoice(invoiceId);

      toast.info('Cancelling invoice. Waiting for confirmation...');
      const receipt = await tx.wait();

      toast.success('Invoice cancelled successfully!');
      
      // Reload user invoices
      await loadUserInvoices();

      return {
        success: true,
        txHash: receipt.transactionHash
      };
    } catch (error) {
      console.error('Failed to cancel invoice:', error);
      toast.error('Failed to cancel invoice: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Get invoice details
  const getInvoiceDetails = async (invoiceId) => {
    try {
      // Treat purely numeric positive strings as on-chain IDs
      const isNumericId = typeof invoiceId === 'string' && /^\d+$/.test(invoiceId);

      if (isNumericId) {
        const response = await contractAPI.getInvoice(invoiceId);
        if (response.success) return response.invoice;
        throw new Error('Failed to get invoice details');
      }

      // Fallback to Mongo metadata by invoiceId (e.g., INV-...)
      const meta = await invoiceAPI.getInvoiceMetadata(invoiceId);
      if (meta.success && meta.invoice) {
        const inv = meta.invoice;
        // Normalize to the shape InvoiceDetails expects
        return {
          id: inv.blockchain?.invoiceId || invoiceId,
          blockchainId: inv.blockchain?.invoiceId || null,
          ipfsHash: inv.ipfs?.hash || inv.ipfsHash,
          issuer: inv.issuer?.walletAddress || inv.issuer,
          recipient: inv.recipient?.walletAddress || inv.recipient,
          amount: inv.amount, // Already ETH number from Mongo
          tokenAddress: inv.tokenAddress || null,
          // Map string statuses to numeric-like for UI compatibility (created/pending -> 0 etc.)
          status: (() => {
            const s = (inv.status || '').toLowerCase();
            if (s === 'paid') return 1;
            if (s === 'disputed') return 2;
            if (s === 'resolved') return 3;
            if (s === 'cancelled') return 4;
            // draft/pending/overdue -> treat as Created for actions visibility
            return 0;
          })(),
          createdAt: inv.createdAt,
          dueDate: inv.dueDate,
          paidAt: inv.paidDate || null,
          description: inv.description || inv.title || ''
        };
      }
      throw new Error('Failed to get invoice details');
    } catch (error) {
      console.error('Failed to get invoice details:', error);
      throw error;
    }
  };

  // Get invoice by status
  const getInvoicesByStatus = async (status, limit = 10, offset = 0) => {
    try {
      const response = await contractAPI.getInvoicesByStatus(status, limit, offset);
      if (response.success) {
        return response.invoices;
      }
      throw new Error('Failed to get invoices by status');
    } catch (error) {
      console.error('Failed to get invoices by status:', error);
      throw error;
    }
  };

  // Format invoice status
  const formatInvoiceStatus = (status) => {
    // Accept both numeric (on-chain) and string (Mongo) statuses
    if (typeof status === 'string') {
      const s = status.toLowerCase();
      if (s === 'paid') return 'Paid';
      if (s === 'disputed') return 'Disputed';
      if (s === 'resolved') return 'Resolved';
      if (s === 'cancelled') return 'Cancelled';
      if (s === 'overdue') return 'Overdue';
      if (s === 'pending' || s === 'draft') return 'Created';
      return 'Unknown';
    }

    const statusMap = { 0: 'Created', 1: 'Paid', 2: 'Disputed', 3: 'Resolved', 4: 'Cancelled' };
    return statusMap[status] || 'Unknown';
  };

  // Get status color
  const getStatusColor = (status) => {
    if (typeof status === 'string') {
      const s = status.toLowerCase();
      if (s === 'paid') return 'success';
      if (s === 'disputed') return 'error';
      if (s === 'resolved') return 'info';
      if (s === 'cancelled') return 'default';
      if (s === 'overdue') return 'error';
      if (s === 'pending' || s === 'draft') return 'warning';
      return 'default';
    }
    const colorMap = { 0: 'warning', 1: 'success', 2: 'error', 3: 'info', 4: 'default' };
    return colorMap[status] || 'default';
  };

  // MongoDB-specific methods
  const searchInvoices = async (filters) => {
    try {
      setLoading(true);
      const response = await invoiceAPI.searchInvoices({ 
        walletAddress: account, 
        ...filters 
      });
      return response.results || [];
    } catch (error) {
      console.error('Failed to search invoices:', error);
      toast.error('Failed to search invoices');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getDashboardData = async () => {
    if (!account) return null;
    
    try {
      setLoading(true);
      return await invoiceAPI.getDashboardData(account);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateUserInfo = async (updatedInfo) => {
    try {
      const response = await invoiceAPI.updateUserPreferences(account, updatedInfo);
      if (response.user) {
        setUserInfo(response.user);
        toast.success('Profile updated successfully');
      }
      return response;
    } catch (error) {
      console.error('Failed to update user info:', error);
      toast.error('Failed to update profile');
      throw error;
    }
  };

  const getInvoiceTemplates = async () => {
    try {
      const response = await invoiceAPI.getUserTemplates(account);
      return response.templates || [];
    } catch (error) {
      console.error('Failed to load templates:', error);
      return [];
    }
  };

  const createInvoiceTemplate = async (templateData) => {
    try {
      const response = await invoiceAPI.createTemplate({
        ...templateData,
        walletAddress: account
      });
      toast.success('Template created successfully');
      return response.template;
    } catch (error) {
      console.error('Failed to create template:', error);
      toast.error('Failed to create template');
      throw error;
    }
  };

  // Load invoices on account change (with debouncing)
  useEffect(() => {
    let timeoutId;
    const debug = process.env.REACT_APP_DEBUG_AUTH === 'true';
    if (!account) {
      setUserInvoices([]);
      setUserInfo(null);
      return () => {};
    }
    if (!authReady) {
      if (debug) console.info('[invoice][client] waiting authReady before loading invoices');
      return () => {};
    }
    if (authUser && !idToken) {
      if (debug) console.info('[invoice][client] auth user present but idToken not yet ready');
      return () => {};
    }
    // If we had a pending load (token just arrived), run immediately with force to bypass rate limit
    if (pendingLoad) {
      if (debug) console.info('[invoice][client] processing pending invoice load (force)');
      loadUserInvoices({ force: true });
      setPendingLoad(false);
      return () => {};
    }
    timeoutId = setTimeout(() => {
      if (debug) console.info('[invoice][client] loading invoices for account', account);
      loadUserInvoices();
    }, 300);
    return () => timeoutId && clearTimeout(timeoutId);
  }, [account, authReady, authUser, idToken, pendingLoad, loadUserInvoices]);

  // Expose manual reload helper in debug mode
  useEffect(() => {
    if (process.env.REACT_APP_DEBUG_AUTH === 'true' && typeof window !== 'undefined') {
      window._reloadInvoices = () => loadUserInvoices({ force: true });
    }
  }, [loadUserInvoices]);

  const value = {
    userInvoices,
  sentInvoices,
  receivedInvoices,
    userInfo,
    loading,
    contract,
    // expose for debugging in dev environments
    _debugGetInvoice: async (id) => {
      if (!contract) return null;
      try { return await contract.getInvoice(id); } catch (e) { return e.message; }
    },
    createInvoice,
    payInvoiceETH,
    payInvoiceToken,
    raiseDispute,
    cancelInvoice,
    getInvoiceDetails,
    getInvoicesByStatus,
    loadUserInvoices,
    searchInvoices,
    getDashboardData,
    updateUserInfo,
    getInvoiceTemplates,
    createInvoiceTemplate,
    formatInvoiceStatus,
  getStatusColor,
  verifyWalletOwnership,
  };

  return (
    <InvoiceContext.Provider value={value}>
      {children}
    </InvoiceContext.Provider>
  );
};

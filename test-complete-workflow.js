// Test the complete invoice creation workflow
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

async function testCompleteWorkflow() {
  try {
    console.log('Testing complete invoice creation workflow...');
    
    // Test wallet address
    const walletAddress = '0x742d35Cc6608C4532C5C8C8c8c8c8c8c8c8c8c8c';
    
    // Step 1: Create or get user
    console.log('\n1. Creating/Getting user...');
    const userData = {
      walletAddress,
      name: 'Test User',
      email: 'test@example.com',
      company: 'Test Company'
    };
    
    const userResponse = await axios.post(
      'http://localhost:3001/api/invoice/users/profile',
      userData
    );
    
    console.log('User response:', userResponse.data);
    
    // Step 2: Create invoice metadata
    console.log('\n2. Creating invoice metadata...');
    
    const invoiceData = {
      invoiceId: `TEST-INV-${Date.now()}`,
      walletAddress,
      title: 'Test Invoice',
      description: 'Test invoice for workflow testing',
      amount: 100,
      currency: 'ETH',
      dueDate: new Date('2025-12-31').toISOString(),
      recipientName: 'Recipient User',
      recipientEmail: 'recipient@example.com',
      recipientWallet: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199'
    };
    
    const metadataResponse = await axios.post(
      'http://localhost:3001/api/invoice/metadata',
      invoiceData
    );
    
    console.log('Metadata response:', metadataResponse.data);
    const createdInvoice = metadataResponse.data.invoice;
    
    // Step 3: Generate PDF
    console.log('\n3. Generating PDF...');
    
    const pdfData = {
      recipientAddress: invoiceData.recipientWallet,
      recipientName: invoiceData.recipientName,
      recipientEmail: invoiceData.recipientEmail,
      amount: invoiceData.amount.toString(),
      description: invoiceData.description,
      dueDate: invoiceData.dueDate,
      title: invoiceData.title
    };
    
    const pdfResponse = await axios.post(
      'http://localhost:3001/api/invoice/preview',
      pdfData,
      {
        responseType: 'arraybuffer',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    const pdfPath = path.join(__dirname, 'test-workflow.pdf');
    fs.writeFileSync(pdfPath, Buffer.from(pdfResponse.data));
    console.log(`✅ PDF generated and saved to ${pdfPath} (${pdfResponse.data.length} bytes)`);
    
    // Step 4: Upload PDF to IPFS
    console.log('\n4. Uploading PDF to IPFS...');
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(pdfPath));
    
    const ipfsResponse = await axios.post(
      'http://localhost:3001/api/ipfs/upload',
      formData,
      {
        headers: {
          ...formData.getHeaders()
        }
      }
    );
    
    console.log('IPFS Upload Response:', ipfsResponse.data);
    
    if (ipfsResponse.data.success && ipfsResponse.data.ipfsHash) {
      console.log('✅ IPFS Upload Success! Hash:', ipfsResponse.data.ipfsHash);
      
      // Step 5: Update invoice status (simulating blockchain transaction)
      console.log('\n5. Updating invoice status...');
      
      const updateData = {
        status: 'pending',
        transactionHash: '0x' + '1234abcd'.repeat(8),
        blockNumber: 12345678
      };
      
      const updateResponse = await axios.put(
        `http://localhost:3001/api/invoice/invoices/${createdInvoice.invoiceId}/status`,
        updateData
      );
      
      console.log('Update Response:', updateResponse.data);
      console.log('\n✅ Complete workflow test SUCCESSFUL!');
      
    } else {
      console.error('❌ IPFS Upload Failed');
    }
  } catch (error) {
    console.error('❌ Error in workflow test:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', typeof error.response.data === 'string' ? 
        error.response.data : JSON.stringify(error.response.data, null, 2));
    }
  }
}

testCompleteWorkflow();

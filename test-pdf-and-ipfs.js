// Test script to check invoice PDF preview and Pinata API
const fs = require('fs');
const path = require('path');
const axios = require('axios');

async function testPDFGeneration() {
  try {
    console.log('Testing PDF preview generation...');
    
    const invoiceData = {
      recipientAddress: '0x742d35Cc6608C4532C5C8C8c8c8c8c8c8c8c8c8c',
      recipientName: 'Test User',
      recipientEmail: 'test@example.com',
      amount: '100',
      description: 'Test invoice generation',
      dueDate: new Date('2025-12-31').toISOString(),
      title: 'Test Invoice'
    };
    
    console.log('Sending data to preview endpoint...');
    
    const response = await axios.post(
      'http://localhost:3001/api/invoice/preview',
      invoiceData,
      {
        responseType: 'arraybuffer',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('PDF Response Status:', response.status);
    console.log('PDF Content Type:', response.headers['content-type']);
    console.log('PDF Content Length:', response.data.length, 'bytes');
    
    // Save the PDF
    const pdfPath = path.join(__dirname, 'test-invoice.pdf');
    fs.writeFileSync(pdfPath, response.data);
    console.log('✅ PDF Preview saved to', pdfPath);
    
    // Now test uploading the PDF to IPFS
    console.log('\nTesting IPFS upload with the generated PDF...');
    
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
    } else {
      console.error('❌ IPFS Upload Failed');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data.toString());
    }
  }
}

// Execute test
testPDFGeneration();

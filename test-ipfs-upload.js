// Test IPFS upload with additional metadata
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

async function testIPFSUpload() {
  try {
    console.log('Testing IPFS upload with proper metadata...');
    
    const pdfPath = path.join(__dirname, 'test-workflow.pdf');
    if (!fs.existsSync(pdfPath)) {
      console.error('❌ PDF file not found:', pdfPath);
      return;
    }
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(pdfPath));
    formData.append('title', 'Test Invoice');
    formData.append('description', 'Test invoice description');
    formData.append('invoiceId', 'TEST-INV-' + Date.now());
    
    console.log('Sending IPFS upload request with metadata...');
    
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
      console.error('❌ IPFS Upload Failed:', ipfsResponse.data);
    }
  } catch (error) {
    console.error('❌ Error in IPFS upload test:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', typeof error.response.data === 'string' ? 
        error.response.data : JSON.stringify(error.response.data, null, 2));
    }
  }
}

testIPFSUpload();

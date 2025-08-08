// Test script to check Pinata API integration
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

async function testPinataUpload() {
  try {
    const filePath = path.join(__dirname, 'test-pinata.txt');
    const fileContent = fs.readFileSync(filePath);
    
    const formData = new FormData();
    formData.append('file', fileContent, { filename: 'test-pinata.txt' });

    console.log('Sending file to IPFS endpoint...');
    
    const response = await axios.post(
      'http://localhost:3001/api/ipfs/upload',
      formData,
      {
        headers: {
          ...formData.getHeaders()
        }
      }
    );

    console.log('IPFS Upload Response:', response.data);
    
    if (response.data.success && response.data.ipfsHash) {
      console.log('✅ IPFS Upload Success! Hash:', response.data.ipfsHash);
      // Now try to fetch it
      console.log('Trying to fetch the file from IPFS...');
      
      const fetchResponse = await axios.get(`http://localhost:3001/api/ipfs/file/${response.data.ipfsHash}`);
      console.log('✅ IPFS Fetch Success! Status:', fetchResponse.status);
    } else {
      console.error('❌ IPFS Upload Failed:', response.data);
    }
  } catch (error) {
    console.error('❌ Error testing Pinata IPFS:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

// Execute test
testPinataUpload();

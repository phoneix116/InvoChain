// Test script to check PDF preview generation only
const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function testPDFPreview() {
  try {
    console.log('Testing PDF preview generation...');
    
    // Data structure that matches our updated schema
    const testData = {
      recipientAddress: '0x742d35Cc6608C4532C5C8C8c8c8c8c8c8c8c8c8c',
      recipientName: 'Test User',
      recipientEmail: 'test@example.com',
      amount: '100',
      description: 'Test invoice description',
      dueDate: new Date('2025-12-31').toISOString(),
      title: 'Test Invoice'
    };
    
    console.log('Sending request to PDF preview endpoint...');
    console.log('Data:', JSON.stringify(testData, null, 2));
    
    const response = await axios.post(
      'http://localhost:3001/api/invoice/preview',
      testData,
      {
        responseType: 'arraybuffer',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    const pdfPath = path.join(__dirname, 'test-preview.pdf');
    fs.writeFileSync(pdfPath, Buffer.from(response.data));
    
    console.log(`✅ PDF saved to ${pdfPath}`);
    console.log(`Size: ${response.data.length} bytes`);
    
  } catch (error) {
    console.error('❌ Error testing PDF preview:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      
      // Convert arraybuffer to string if needed
      let responseData = error.response.data;
      if (responseData instanceof ArrayBuffer || Buffer.isBuffer(responseData)) {
        responseData = Buffer.from(responseData).toString('utf8');
      }
      
      console.error('Response data:', responseData);
    }
  }
}

testPDFPreview();

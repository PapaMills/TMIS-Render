// backend/testClient.js - Simple API test client
const axios = require('axios');

const API_BASE = 'http://localhost:5000';

async function testAPI() {
  try {
    console.log('Testing TMIS API endpoints...\n');

    // Test 1: Basic server health
    console.log('1. Testing server health...');
    const healthResponse = await axios.get(API_BASE);
    console.log('✅ Server is running:', healthResponse.data);

    // Test 2: Test registration
    console.log('\n2. Testing user registration...');
    const registerData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'testpass123',
      publicKey: 'testpublickey123'
    };

    const registerResponse = await axios.post(`${API_BASE}/api/auth/register`, registerData, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('✅ Registration successful:', registerResponse.data);

    // Test 3: Test login with password
    console.log('\n3. Testing password login...');
    const loginData = {
      email: 'test@example.com',
      password: 'testpass123'
    };

    const loginResponse = await axios.post(`${API_BASE}/api/auth/login/password`, loginData, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('✅ Password login successful:', loginResponse.data);

    // Test 4: Test login with wrong password
    console.log('\n4. Testing login with wrong password...');
    const wrongLoginData = {
      email: 'test@example.com',
      password: 'wrongpassword'
    };

    try {
      await axios.post(`${API_BASE}/api/auth/login/password`, wrongLoginData, {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.log('✅ Wrong password correctly rejected:', error.response.data.message);
    }

    console.log('\n🎉 All tests passed! API is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

testAPI();

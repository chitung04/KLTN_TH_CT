const https = require('https');
const http = require('http');

async function testRegister() {
    try {
        console.log('🧪 Testing registration API...\n');

        const testData = {
            fullName: 'Test User Registration',
            email: `test${Date.now()}@example.com`,
            phone: '0912345678',
            password: 'Password123!',
            role: 'patient'
        };

        console.log('📤 Sending registration data:');
        console.log(JSON.stringify(testData, null, 2));
        console.log('');

        const postData = JSON.stringify(testData);

        const options = {
            hostname: 'localhost',
            port: 5000,
            path: '/api/auth/register',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    console.log('✅ Registration successful!');
                    console.log('📥 Response:');
                    console.log(JSON.stringify(JSON.parse(data), null, 2));
                } else {
                    console.error('❌ Registration failed!');
                    console.error('📥 Error response:');
                    console.error('Status:', res.statusCode);
                    console.error('Data:', JSON.stringify(JSON.parse(data), null, 2));
                }
            });
        });

        req.on('error', (error) => {
            console.error('⚠️ Error:', error.message);
        });

        req.write(postData);
        req.end();

    } catch (error) {
        console.error('❌ Test failed!');
        console.error('Error:', error.message);
    }
}

testRegister();

const http = require('http');

const data = JSON.stringify({
  source_type: 'NGO / Organization',
  area: 'Civil Lines',
  ward: 'Civil Lines - Ward 2',
  category: 'Food & Nutrition',
  affected_count: 100,
  description: 'pani ki kami',
  title: 'Need: Food & Nutrition at Civil Lines'
});

const req = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/needs',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('Status:', res.statusCode, 'Body:', body));
});

req.on('error', console.error);
req.write(data);
req.end();

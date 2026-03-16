const http = require('http');

const data = JSON.stringify({
  type: 'loan',
  name: 'Test Personal Loan',
  bank: 'Bank of Tests',
  initialCapital: 10000,
  termMonths: 60,
  startDate: '2023-01-01',
  interestType: 'fixed',
  interestRate: 5.5,
  monthlyPayment: 200
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/liabilities',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  console.log(statusCode: );
  res.on('data', d => {
    process.stdout.write(d);
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();

fetch('http://localhost:4000/bug-reports/cmq3q9hgv000101nzv04ighql/status', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: 'SOLVED' })
}).then(res => res.text()).then(console.log).catch(console.error);

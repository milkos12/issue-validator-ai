// test-webhook.js
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

app.post('/', (req, res) => {
  console.log('\n🔔 WEBHOOK RECIBIDO');
  console.log('Event:', req.headers['x-github-event']);
  console.log('Action:', req.body.action);
  
  if (req.body.issue) {
    console.log('Issue #:', req.body.issue.number);
    console.log('Título:', req.body.issue.title);
  }
  
  res.status(200).send('OK');
});

app.listen(3000, () => {
  console.log('🚀 Test server corriendo en http://localhost:3000');
});
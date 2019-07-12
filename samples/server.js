const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

const bitcoinPriceService = require('./bitcoinPriceService');

app.set('port', PORT);
app.use('/', bitcoinPriceService);

const server = app
  .listen(app.get('port'), () => {
    console.log(`Server running on http://localhost:${PORT}/ with `);
  })
  .on('error', err => {
    if (err) {
      console.log('Error starting sample project');
    }
  });

module.exports = server;

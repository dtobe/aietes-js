const getPort = require('get-port');
const argv = require('yargs').argv;
const fs = require('fs');

const AietesServer = require('../mock-server');

const standalone = async() => {
  console.info('Starting Aietes standalone');

  const port = argv.port || await getPort();

  const responseFileName = argv.json;
  let jsonResponse;
  if (responseFileName) {
    try {
      jsonResponse = JSON.parse(fs.readFileSync(responseFileName, 'utf8'));
    } catch (err) {
      console.error(err.message);
      console.error(`Reading response definition file '${responseFileName}' failed. Aietes exiting.`);
      process.exit(1);
    }
  }
  const response = jsonResponse || {
    '/': {
      get: {
        status: 200,
        headers: {},
        data: { hello: 'Aietes' }
      }
    }
  };

  const standaloneMock = new AietesServer(response, port);
  standaloneMock.start();
};

module.exports = standalone();

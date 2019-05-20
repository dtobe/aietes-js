const getPort = require("get-port");
const argv = require("yargs").argv;
const fs = require('fs');

const MockServer = require("../mock-server");

standalone = async () => {

    const _port = argv.port || await getPort();
    const responseFileName = argv.json;
    let jsonResponse;
    if (responseFileName) {
        jsonResponse = JSON.parse(fs.readFileSync(responseFileName, 'utf8'));
    }

    const responseObject = jsonResponse || {
        status: argv.status || 201,
        headers: argv.headers || { "some-header": "abc-123" },
        data: argv.data || { hello: "Aietes"}
    };
    const endpoint = {
        "/": {
            get: responseObject
        }
    };
    const standaloneMock = new MockServer(endpoint, _port);
    standaloneMock.start();
    console.info("started standalone.");
};

module.exports = standalone();
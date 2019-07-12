const getPort = require("get-port");
const argv = require("yargs").argv;
const fs = require('fs');

const AietesServer = require("../mock-server");

standalone = async () => {
    console.info("Starting Aietes standalone");

    const port = argv.port || await getPort();

    const responseFileName = argv.json;
    let jsonResponse;
    if (responseFileName) {
        jsonResponse = JSON.parse(await fs.readFile(responseFileName, 'utf8'));
    }

    const responseObject = jsonResponse || {
        status: argv.status || 200,
        headers: argv.headers || {},
        data: argv.data || { hello: "Aietes"}
    };
    const endpoint = {
        "/": {
            get: responseObject
        }
    };
    const standaloneMock = new AietesServer(endpoint, port);
    standaloneMock.start();
};

module.exports = standalone();
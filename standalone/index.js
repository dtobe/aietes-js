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

    const response = jsonResponse || {
        "/": {
            get: {
                status: 200,
                headers: {},
                data: { hello: "Aietes"}
            }
        }
    };
    const standaloneMock = new AietesServer(response, port);
    standaloneMock.start();
};

module.exports = standalone();
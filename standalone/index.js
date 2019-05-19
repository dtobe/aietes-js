const getPort = require("get-port");
const argv = require("yargs").argv;
const MockServer = require("../mock-server");

standalone = async () => {

    const _port = argv.port || await getPort();
    const responseObject = {
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
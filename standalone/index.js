const getPort = require("get-port");
const MockServer = require("../mock-server");

standalone = async () => {
    const randomPort = await getPort();
    const responseObject = {
        status: 201,
        headers: { "some-header": "abc-123" },
        data: { hello: "Aietes"}
    };
    const endpoint = {
        "/": {
            get: responseObject
        }
    };
    const standaloneMock = new MockServer(endpoint, randomPort);
    standaloneMock.start();
    console.info("started standalone.");
};

module.exports = standalone();
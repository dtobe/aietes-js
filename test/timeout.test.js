const request = require("supertest");
const AietesServer = require("../mock-server");
const getPort = require("get-port");

describe("Aietes Server Timeout IT", () => {
  let mockServer;
  const responseObject = {
    headers: { "some-header": "header value" },
    data: { field1: 1, field2: "value" }
  };

  beforeAll(async () => {
    mockServer = new AietesServer(
      {
        "/endpoint1": {
          get: responseObject
        },
      },
      await getPort()
    );

    mockServer.start();
  });

  afterAll(() => {
    mockServer.stop();
  });

  afterEach(() => {
    mockServer.setDelayMs(0);
    mockServer.setDelayMs(0, "/endpoint1", "get");
  });

  it('should allow configuring delay globally', async (done) => {
    mockServer.setDelayMs(200);
    try {
      await request(mockServer.server).get("/endpoint1").timeout(190);
      done.fail ("Request did not time out");
    } catch (error) {
      expect(error.code).toEqual('ECONNABORTED');
      done();
    }
  });

  it('should allow configuring delay per endpoint', async (done) => {
    mockServer.setDelayMs(200, "/endpoint1", "get");
    try {
      await request(mockServer.server).get("/endpoint1").timeout(190);
      done.fail ("Request did not time out");
    } catch (error) {
      expect(error.code).toEqual('ECONNABORTED');
      done();
    }
  });

  it('should reset the global delay correctly', async (done) => {
    mockServer.setDelayMs(500);
    try {
      await request(mockServer.server).get("/endpoint1").timeout(100);
      done.fail ("Request did not time out");
    } catch (error) {
      expect(error.code).toEqual('ECONNABORTED');
    }

    mockServer.setDelayMs(0);
    const res = await request(mockServer.server).get("/endpoint1").timeout(100);
    expect(res.status).toBe(200);

    done();
  });

  it('should reset the per endpoint delay correctly', async (done) => {
    mockServer.setDelayMs(500, "/endpoint1", "get");
    try {
      await request(mockServer.server).get("/endpoint1").timeout(100);
      done.fail ("Request did not time out");
    } catch (error) {
      expect(error.code).toEqual('ECONNABORTED');
    }
    
    mockServer.setDelayMs(0, "/endpoint1", "get");
    const res = await request(mockServer.server).get("/endpoint1").timeout(100);
    expect(res.status).toBe(200);

    done();
  });
});
const request = require('supertest');
const AietesServer = require('../mock-server');
const getPort = require('get-port');

const responseConfig = {
  '/endpoint1/:pathVariable': {
    get: {
      data: { field1: 1, field2: 'value' }
    }
  },
  '/endpoint1/': {
    get: {
      status: 201
    }
  }
};

describe('Aietes Server verify call counts IT', () => {
  let mockServer;

  beforeEach(async() => {
    mockServer = new AietesServer(
      responseConfig,
      await getPort()
    );

    mockServer.start();
  });

  afterEach(() => {
    mockServer.stop();
  });

  it('should evaluate to false if endpoint has not been called', async() => {
    expect(mockServer.verifyTimesCalled('/endpoint1/', 'get', 1)).toBe(false);
  });

  it('should evaluate to true if endpoint was called correct number of times', async() => {
    await request(mockServer.server).get('/endpoint1/');
    expect(mockServer.verifyTimesCalled('/endpoint1/', 'get', 1)).toBe(true);
  });

  it('should reset stats when resetting response config', async() => {
    await request(mockServer.server).get('/endpoint1/');

    mockServer.reset(responseConfig);

    await request(mockServer.server).get('/endpoint1/');
    expect(mockServer.verifyTimesCalled('/endpoint1/', 'get', 1)).toBe(true);
  });

  it('should ignore case of method parameter', async() => {
    await request(mockServer.server).get('/endpoint1/');
    expect(mockServer.verifyTimesCalled('/endpoint1/', 'GET', 1)).toBe(true);
  });

  it.skip('should allow matching the endpoint to verify by regex', async() => {
    await request(mockServer.server).get('/endpoint1/');
    expect(mockServer.verifyTimesCalled('/endpoint1.*', 'get', 1)).toBe(true);
  });

  it('should evaluate to false if endpoint was called more than the expected number of times', async() => {
    await request(mockServer.server).get('/endpoint1/');
    await request(mockServer.server).get('/endpoint1/');
    expect(mockServer.verifyTimesCalled('/endpoint1/', 'get', 1)).toBe(false);
  });
});

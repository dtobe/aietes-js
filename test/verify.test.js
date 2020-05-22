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
    expect(mockServer.timesCalled('/endpoint1/', 'get')).toBe(0);
  });

  it('should evaluate to true if endpoint was called correct number of times', async() => {
    await request(mockServer.server).get('/endpoint1/');
    expect(mockServer.timesCalled('/endpoint1/', 'get')).toBe(1);
  });

  it('should reset stats when resetting response config', async() => {
    await request(mockServer.server).get('/endpoint1/');

    mockServer.reset(responseConfig);

    await request(mockServer.server).get('/endpoint1/');
    expect(mockServer.timesCalled('/endpoint1/', 'get')).toBe(1);
  });

  it('should ignore case of method parameter', async() => {
    await request(mockServer.server).get('/endpoint1/');
    expect(mockServer.timesCalled('/endpoint1/', 'GET')).toBe(1);
  });

  it('should evaluate to false if endpoint was called more than the expected number of times', async() => {
    await request(mockServer.server).get('/endpoint1/');
    await request(mockServer.server).get('/endpoint1/');
    expect(mockServer.timesCalled('/endpoint1/', 'get')).not.toBe(1);
  });
});

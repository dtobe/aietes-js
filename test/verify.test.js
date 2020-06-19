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
      status: 204
    },
    post: {
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

  it('should evaluate to 0 if endpoint has not been called', () => {
    expect(mockServer.timesCalled('/endpoint1/', 'get')).toBe(0);
  });

  it('should evaluate to correct number of calls', async() => {
    await request(mockServer.server).get('/endpoint1/');
    expect(mockServer.timesCalled('/endpoint1/', 'get')).toBe(1);

    await request(mockServer.server).get('/endpoint1/');
    expect(mockServer.timesCalled('/endpoint1/', 'get')).toBe(2);

    await request(mockServer.server).get('/endpoint1/');
    await request(mockServer.server).get('/endpoint1/');
    expect(mockServer.timesCalled('/endpoint1/', 'get')).toBe(4);
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

  it('should ignore only return the number of calls to the given resource', async() => {
    await request(mockServer.server).get('/endpoint1/pathvariable');
    expect(mockServer.timesCalled('/endpoint1/', 'get')).toBe(0);
  });

  it('should handle unknown resources gracefully', () => {
    expect(mockServer.timesCalled('/someotherendpoint/', 'get')).toBe(0);
  });

  it('should accept a predicate as a filter for path', async() => {
    await request(mockServer.server).get('/endpoint1/');
    await request(mockServer.server).get('/endpoint1/pathvariable');
    expect(mockServer.timesCalled(path => { return path.startsWith('/endpoint'); }, 'get')).toBe(2);
  });

  it('should accept a list of HTTP methods as a filter for method', async() => {
    await request(mockServer.server).post('/endpoint1/');
    await request(mockServer.server).get('/endpoint1/');
    expect(mockServer.timesCalled('/endpoint1/', ['get', 'post'])).toBe(2);
  });
});

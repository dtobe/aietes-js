const request = require('supertest')
const AietesServer = require('../mock-server')
const getPort = require('get-port')

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
}

describe('Aietes Server verify call stats IT', () => {
  let mockServer

  beforeEach(async() => {
    mockServer = new AietesServer(
      responseConfig,
      await getPort()
    )

    mockServer.start()
  })

  afterEach(() => {
    mockServer.stop()
  })

  describe('Verify call counts', () => {
    it('should evaluate to 0 if endpoint has not been called', () => {
      expect(mockServer.timesCalled('/endpoint1/', 'get')).toBe(0)
    })

    it('should handle unknown resources gracefully', () => {
      expect(mockServer.timesCalled('/someotherendpoint/', 'get')).toBe(0)
    })

    it('should evaluate to correct number of calls', async() => {
      await request(mockServer.server).get('/endpoint1/')
      expect(mockServer.timesCalled('/endpoint1/', 'get')).toBe(1)

      await request(mockServer.server).get('/endpoint1/')
      expect(mockServer.timesCalled('/endpoint1/', 'get')).toBe(2)

      await request(mockServer.server).get('/endpoint1/')
      await request(mockServer.server).get('/endpoint1/')
      expect(mockServer.timesCalled('/endpoint1/', 'get')).toBe(4)
    })

    it('should ignore case of method parameter', async() => {
      await request(mockServer.server).get('/endpoint1/')
      expect(mockServer.timesCalled('/endpoint1/', 'GET')).toBe(1)
    })

    it('should ignore only return the number of calls to the given resource', async() => {
      await request(mockServer.server).get('/endpoint1/pathvariable')
      expect(mockServer.timesCalled('/endpoint1/', 'get')).toBe(0)
    })

    it('should accept a predicate as a filter for path', async() => {
      await request(mockServer.server).get('/endpoint1/')
      await request(mockServer.server).get('/endpoint1/pathvariable')
      expect(mockServer.timesCalled(path => { return path.startsWith('/endpoint') }, 'get')).toBe(2)
    })

    it('should accept a list of HTTP methods as a filter for method', async() => {
      await request(mockServer.server).post('/endpoint1/')
      await request(mockServer.server).get('/endpoint1/')
      expect(mockServer.timesCalled('/endpoint1/', ['get', 'post'])).toBe(2)
    })

    it('should ignore query parameters', async() => {
      await request(mockServer.server).get('/endpoint1/')
      await request(mockServer.server).get('/endpoint1/?param=foo')
      expect(mockServer.timesCalled('/endpoint1/', 'get')).toBe(2)
    })
  })

  describe('Verify call arguments', () => {
    it('should return query parameters per call', async() => {
      await request(mockServer.server).get('/endpoint1/?param1=foo&param2=bar&param3=666')
      expect(mockServer.queryParameters('/endpoint1/', 'get').length).toEqual(1)
      expect(mockServer.queryParameters('/endpoint1/', 'get')[0]).toEqual({ param1: 'foo', param2: 'bar', param3: '666' })
    })

    it('should append further calls to the list of query parameters', async() => {
      await request(mockServer.server).get('/endpoint1/?param1=foo&param2=bar&param3=666')
      await request(mockServer.server).get('/endpoint1/?param1=newFoo&param2=baz&param3=0')
      expect(mockServer.queryParameters('/endpoint1/', 'get').length).toEqual(2)
      expect(mockServer.queryParameters('/endpoint1/', 'get')[0]).toEqual({ param1: 'foo', param2: 'bar', param3: '666' })
      expect(mockServer.queryParameters('/endpoint1/', 'get')[1]).toEqual({ param1: 'newFoo', param2: 'baz', param3: '0' })
    })

    it('should not include path variables in query parameters', async() => {
      await request(mockServer.server).get('/endpoint1/bar/?param=foo')
      expect(mockServer.queryParameters('/endpoint1/bar/', 'get')[0]).toEqual({ param: 'foo' })
    })
  })

  describe('Verify call headers', () => {
    it('should return query headers per call', async() => {
      await request(mockServer.server).get('/endpoint1/').set('header1', 'headervalue1').set('header2', 'headervalue2')
      expect(mockServer.headers('/endpoint1/', 'get').length).toEqual(1)
      expect(mockServer.headers('/endpoint1/', 'get')[0]).toMatchObject({ header1: 'headervalue1', header2: 'headervalue2' }) // not equal because there are automatically added headers
    })

    it('should append further calls to the list of query parameters', async() => {
      await request(mockServer.server).get('/endpoint1/').set('header1', 'headervalue1').set('header2', 'headervalue2')
      await request(mockServer.server).get('/endpoint1/').set('headerX', 'headervalueX').set('headerY', 'headervalueY')
      expect(mockServer.headers('/endpoint1/', 'get').length).toEqual(2)
      expect(mockServer.headers('/endpoint1/', 'get')[0]).toMatchObject({ header1: 'headervalue1', header2: 'headervalue2' })
      expect(mockServer.headers('/endpoint1/', 'get')[1]).toMatchObject({ headerx: 'headervalueX', headery: 'headervalueY' })
    })
  })

  it('should reset stats when resetting response config', async() => {
    await request(mockServer.server).get('/endpoint1/?param=foo')

    mockServer.reset({
      '/endpoint2/': {
        get: {}
      }
    })

    await request(mockServer.server).get('/endpoint2/')
    expect(mockServer.timesCalled('/endpoint1/', 'get')).toBe(0)
    expect(mockServer.queryParameters('/endpoint1/', 'get').length).toBe(0)
    expect(mockServer.timesCalled('/endpoint2/', 'get')).toBe(1)
    expect(mockServer.queryParameters('/endpoint2/', 'get').length).toBe(1)
    expect(mockServer.headers('/endpoint2/', 'get').length).toBe(1)
  })

  it('should not reset stats when merely updating response config', async() => {
    await request(mockServer.server).get('/endpoint1/')

    mockServer.update({
      '/endpoint1/': {
        get: {
          status: 500
        }
      }
    })

    await request(mockServer.server).get('/endpoint1/')
    expect(mockServer.timesCalled('/endpoint1/', 'get')).toBe(2)
    expect(mockServer.queryParameters('/endpoint1/', 'get').length).toBe(2)
    expect(mockServer.headers('/endpoint1/', 'get').length).toBe(2)
  })

  it('should reset stats but not response config when calling clearStats', async() => {
    await request(mockServer.server).get('/endpoint1/?param=foo')
    expect(mockServer.timesCalled('/endpoint1/', 'get')).toBe(1)
    expect(mockServer.queryParameters('/endpoint1/', 'get').length).toBe(1)
    expect(mockServer.headers('/endpoint1/', 'get').length).toBe(1)

    mockServer.clearStats()
    expect(mockServer.timesCalled('/endpoint1/', 'get')).toBe(0)
    expect(mockServer.queryParameters('/endpoint1/', 'get').length).toBe(0)
    expect(mockServer.headers('/endpoint1/', 'get').length).toBe(0)

    await request(mockServer.server).get('/endpoint1/?param=bar')
    expect(mockServer.timesCalled('/endpoint1/', 'get')).toBe(1)
    expect(mockServer.queryParameters('/endpoint1/', 'get').length).toBe(1)
    expect(mockServer.queryParameters('/endpoint1/', 'get')[0]).toEqual({ param: 'bar' })
    expect(mockServer.headers('/endpoint1/', 'get').length).toBe(1)
  })

  it('should return safe empty stats when no calls have been made', async() => {
    expect(mockServer.timesCalled('/endpoint1/', 'get')).toBe(0)
    expect(mockServer.queryParameters('/endpoint1/', 'get').length).toBe(0)
  })
})

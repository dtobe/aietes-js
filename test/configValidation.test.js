const validateResponseConfig = require('../lib/configValidator')

describe('response config validation', () => {
  describe('validate HTTP methods', () => {
    const validResponseObject = {
      status: 201,
      headers: { 'some-header': 'foo' },
      data: { field1: 1, field2: 'value', field3: false }
    }

    it.each(['get', 'post', 'put', 'delete'])('valid method [%s]', (supportedMethod) => {
      expect(() => validateResponseConfig(validResponseObject, '/foo', supportedMethod)).not.toThrow()
    })

    it.each(['connect', 'foo'])('invalid method [%s] results in error thrown', (supportedMethod) => {
      expect(() => validateResponseConfig(validResponseObject, '/foo', supportedMethod)).toThrow(Error)
    })
  })

  describe('validate response config', () => {
    it('successfully validates empty response config', () => {
      expect(() => validateResponseConfig({}, '/foo', 'get')).not.toThrow()
    })

    it('successfully validates response config with only status', () => {
      const validResponseObject = {
        status: 201
      }
      expect(() => validateResponseConfig(validResponseObject, '/foo', 'get')).not.toThrow()
    })

    it('successfully validates response config with only headers', () => {
      const validResponseObject = {
        headers: { 'some-header': 'foo' }
      }
      expect(() => validateResponseConfig(validResponseObject, '/foo', 'get')).not.toThrow()
    })

    it('successfully validates response config with only response body', () => {
      const validResponseObject = {
        data: { field1: 1, field2: 'value', field3: false }
      }
      expect(() => validateResponseConfig(validResponseObject, '/foo', 'get')).not.toThrow()
    })

    it('successfully validates complex response body config', () => {
      const validResponseObject = {
        status: 201,
        headers: { 'some-header': 'foo', 'some-other-header': 'bar' },
        data: { field1: 1, field2: 'value', field3: false },
        meta: { delayMs: 50 }
      }
      expect(() => validateResponseConfig(validResponseObject, '/foo', 'get')).not.toThrow()
    })

    it('throws error for invalid status config', () => {
      const validResponseObject = {
        status: '400?',
        data: { '3field1': 1, field2: 'value', field3: false }
      }
      expect(() => validateResponseConfig(validResponseObject, '/foo', 'get'))
        .toThrow('Validation error: \'.status\' should be integer')
    })

    it('throws error for invalid headers config', () => {
      const validResponseObject = {
        status: 201,
        headers: { 'some-header/3': 1, 'some-other-header': 'bar' },
        data: { '3field1': 1, field2: 'value', field3: false }
      }
      expect(() => validateResponseConfig(validResponseObject, '/foo', 'get'))
        .toThrow('Validation error: property [some-header/3] at path \'.headers\' should match pattern "^[\\w-]+$"')
    })

    it('throws error for invalid response body config', () => {
      const validResponseObject = {
        data: false
      }
      expect(() => validateResponseConfig(validResponseObject, '/foo', 'get'))
        .toThrow('Validation error: \'.data\' should be object')
    })

    it('throws error for invalid response meta config', () => {
      const validResponseObject = {
        status: 201,
        data: { field1: 1, field2: 'value', field3: false },
        meta: { delayMs: '50ms' }
      }
      expect(() => validateResponseConfig(validResponseObject, '/foo', 'get'))
        .toThrow('Validation error: \'.meta.delayMs\' should be integer')
    })
  })
})

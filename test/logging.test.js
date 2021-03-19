const { log } = require('../lib/logging')

describe('logging facade', () => {
  it('should pass info to the console.log and prepend with Aietes', () => {
    const infoMock = jest.fn()
    console.log = infoMock

    log.info('message')

    expect(infoMock).toHaveBeenCalled()
    expect(infoMock).toHaveBeenCalledWith('[Aietes] message')
  })

  it('should pass warn to the console.warn and prepend with Aietes', () => {
    const warnMock = jest.fn()
    console.warn = warnMock

    log.warn('message')

    expect(warnMock).toHaveBeenCalled()
    expect(warnMock).toHaveBeenCalledWith('[Aietes] message')
  })

  it('should pass calls to info to the console and prepend with Aietes', () => {
    const errorMock = jest.fn()
    console.error = errorMock

    log.error('message')

    expect(errorMock).toHaveBeenCalled()
    expect(errorMock).toHaveBeenCalledWith('[Aietes] message')
  })

  it('should skip console calls for info and warn if environment variable is set', () => {
    const OLD_ENV = process.env
    jest.resetModules() // this is important - it clears the cache
    process.env = { ...OLD_ENV }
    delete process.env.NODE_ENV

    process.env.NO_OUTPUT = true

    const infoMock = jest.fn()
    console.log = infoMock
    const warnMock = jest.fn()
    console.warn = warnMock
    const errorMock = jest.fn()
    console.error = errorMock

    log.info('info')
    log.warn('warn')
    log.error('error')

    expect(infoMock).toHaveBeenCalledTimes(0)
    expect(warnMock).toHaveBeenCalledTimes(0)
    expect(errorMock).toHaveBeenCalledTimes(1)

    process.env = OLD_ENV
  })
})

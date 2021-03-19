// Type definitions for AietesServer
// Project: Aietes-Js

export = AietesServer;

declare class AietesServer {
  constructor(responsesConfig: AietesServer.ResponsesConfig, port: number)

  start(): void
  update(responsesConfig: AietesServer.ResponsesConfig): void
  reset(responsesConfig: AietesServer.ResponsesConfig): void
  clearStats(): void
  stop(): void
  setDelayMs(delayMs: number, path: string, method: string): void
  timesCalled(pathMatcher: string | ((path: string) => boolean), methodMatcher: string | string[]): number

}

declare namespace AietesServer {
  export interface ResponsesConfig {
    [path: string]: {
      [method in 'get' | 'post' | 'put' | 'delete' | 'patch']: {
        status?: number,
        headers?: object,
        data?: object
      }
    }
  }
}
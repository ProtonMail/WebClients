import { RouteExecutor } from './RouteExecutor'
import { ApiResult } from '@proton/docs-shared'
import type { Api } from '@proton/shared/lib/interfaces'

describe('RouteExecutor', () => {
  let mockApi: jest.MockedFunction<Api>
  let executor: RouteExecutor

  beforeEach(() => {
    mockApi = jest.fn()
    executor = new RouteExecutor(mockApi)
  })

  it('should handle successful JSON response', async () => {
    const mockResponse = { data: 'test' }
    mockApi.mockResolvedValueOnce(mockResponse)

    const result = await executor.execute({
      method: 'get',
      url: '/test',
    })

    expect(result).toEqual(ApiResult.ok(mockResponse))
    expect(executor.inflight).toBe(0)
    expect(mockApi).toHaveBeenCalledWith({
      method: 'get',
      url: '/test',
    })
  })

  it('should handle raw binary response', async () => {
    const mockArrayBuffer = new ArrayBuffer(8)
    const mockResponse = {
      arrayBuffer: jest.fn().mockResolvedValueOnce(mockArrayBuffer),
    }
    mockApi.mockResolvedValueOnce(mockResponse)

    const result = await executor.execute({
      method: 'get',
      url: '/test',
      output: 'raw',
    })

    expect(result).toEqual(ApiResult.ok(new Uint8Array(mockArrayBuffer)))
    expect(executor.inflight).toBe(0)
    expect(mockResponse.arrayBuffer).toHaveBeenCalled()
  })

  it('should handle API errors', async () => {
    const mockError = {
      data: {
        Code: 250000,
        Error: 'API Error',
      },
    }
    mockApi.mockRejectedValueOnce(mockError)

    const result = await executor.execute({
      method: 'get',
      url: '/test',
    })

    expect(result).toEqual(
      ApiResult.fail({
        message: 'API Error',
        code: 250000,
      }),
    )
    expect(executor.inflight).toBe(0)
  })

  it('should handle unknown errors', async () => {
    const mockError = {
      data: {
        Code: 0,
        Error: 'Unknown error',
      },
    }
    mockApi.mockRejectedValueOnce(mockError)

    const result = await executor.execute({
      method: 'get',
      url: '/test',
    })

    expect(result).toEqual(
      ApiResult.fail({
        message: 'Unknown error',
        code: 0,
      }),
    )
    expect(executor.inflight).toBe(0)
  })

  it('should track inflight requests', async () => {
    const promise1 = executor.execute({
      method: 'get',
      url: '/test1',
    })
    const promise2 = executor.execute({
      method: 'get',
      url: '/test2',
    })

    expect(executor.inflight).toBe(2)

    await Promise.all([promise1, promise2])

    expect(executor.inflight).toBe(0)
  })
})

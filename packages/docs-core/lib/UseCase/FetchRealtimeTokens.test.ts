import { ApiResult } from '@proton/docs-shared'
import { DocsApiErrorCode } from '@proton/shared/lib/api/docs'
import metrics from '@proton/metrics/index'
import { FetchRealtimeToken } from './FetchRealtimeToken'
import type { NodeMeta } from '@proton/drive-store'

describe('FetchRealtimeToken', () => {
  let fetchRealtimeToken: FetchRealtimeToken
  let mockDocsApi: any

  beforeEach(() => {
    jest.spyOn(metrics.docs_commit_id_out_of_sync_total, 'increment')

    mockDocsApi = {
      createRealtimeValetToken: jest.fn(),
    }

    fetchRealtimeToken = new FetchRealtimeToken(mockDocsApi)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should successfully fetch token and preferences', async () => {
    const mockLookup: NodeMeta = { id: '123' } as unknown as NodeMeta
    const mockCommitId = 'commit-123'

    mockDocsApi.createRealtimeValetToken.mockResolvedValue(
      ApiResult.ok({
        ValetToken: {
          Token: 'test-token',
          Preferences: [{ Name: 'IncludeDocumentName', Value: true }],
        },
      }),
    )

    const result = await fetchRealtimeToken.execute(mockLookup, mockCommitId)

    expect(result.isFailed()).toBe(false)
    expect(result.getValue()).toEqual({
      token: 'test-token',
      preferences: {
        includeDocumentNameInEmails: true,
      },
    })
    expect(mockDocsApi.createRealtimeValetToken).toHaveBeenCalledWith(mockLookup, mockCommitId)
  })

  it('should handle missing IncludeDocumentName preference', async () => {
    mockDocsApi.createRealtimeValetToken.mockResolvedValue(
      ApiResult.ok({
        ValetToken: {
          Token: 'test-token',
          Preferences: [],
        },
      }),
    )

    const result = await fetchRealtimeToken.execute({} as NodeMeta, undefined)

    expect(result.isFailed()).toBe(false)
    expect(result.getValue()).toEqual({
      token: 'test-token',
      preferences: {
        includeDocumentNameInEmails: false,
      },
    })
  })

  it('should handle CommitIdOutOfSync error and increment metric', async () => {
    mockDocsApi.createRealtimeValetToken.mockResolvedValue(
      ApiResult.fail({
        code: DocsApiErrorCode.CommitIdOutOfSync,
        message: 'Commit ID is out of sync',
      }),
    )

    const result = await fetchRealtimeToken.execute({} as NodeMeta, 'old-commit')

    expect(result.isFailed()).toBe(true)
    expect(result.getErrorObject()).toEqual({
      code: DocsApiErrorCode.CommitIdOutOfSync,
      message: 'Commit ID is out of sync',
    })
    expect(metrics.docs_commit_id_out_of_sync_total.increment).toHaveBeenCalledWith({})
  })

  it('should handle generic error without incrementing metric', async () => {
    const genericError = {
      code: 500,
      message: 'Internal server error',
    }

    mockDocsApi.createRealtimeValetToken.mockResolvedValue(ApiResult.fail(genericError))

    const result = await fetchRealtimeToken.execute({} as NodeMeta, undefined)

    expect(result.isFailed()).toBe(true)
    expect(result.getErrorObject()).toEqual(genericError)
    expect(metrics.docs_commit_id_out_of_sync_total.increment).not.toHaveBeenCalled()
  })
})

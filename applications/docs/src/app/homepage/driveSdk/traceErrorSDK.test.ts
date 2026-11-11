import { ValidationError } from '@protontech/drive-sdk'
import { traceErrorSDK } from './traceErrorSDK'
import type { ErrorTracking } from '../utils/errorTracking'

function createErrorTracking(isReportable: boolean): ErrorTracking {
  return { traceError: jest.fn(), addBreadcrumb: jest.fn(), isReportable: () => isReportable }
}

describe('traceErrorSDK', () => {
  it('reports the error wrapped with the current stack, tagged with the SDK switch and the feature', () => {
    const errorTracking = createErrorTracking(true)
    const error = new Error('Node not found')

    traceErrorSDK(errorTracking, error, 'DocsTrashWithDriveSDK')

    expect(errorTracking.traceError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Node not found', cause: error }),
      {
        tags: { initiative: 'realtime-sdk-switch', feature: 'DocsTrashWithDriveSDK' },
      },
    )
  })

  it('reports nothing for an error the host does not report', () => {
    const errorTracking = createErrorTracking(false)

    traceErrorSDK(errorTracking, new Error('Failed to fetch'), 'DocsTrashWithDriveSDK')

    expect(errorTracking.traceError).not.toHaveBeenCalled()
  })

  it('reports nothing for a Drive SDK validation error', () => {
    const errorTracking = createErrorTracking(true)

    traceErrorSDK(errorTracking, new ValidationError('Invalid name'), 'DocsRenameWithDriveSDK')

    expect(errorTracking.traceError).not.toHaveBeenCalled()
  })
})

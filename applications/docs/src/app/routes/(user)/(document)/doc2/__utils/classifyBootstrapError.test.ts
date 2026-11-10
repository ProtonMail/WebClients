import { ValidationError } from '@proton/drive/sdk'
import { DocsApiError, DocsApiErrorCode } from '@proton-docs/realtime-sdk'

import { type BootstrapFailure, classifyBootstrapError, isRetryableBootstrapFailure } from './classifyBootstrapError'

describe('classifyBootstrapError', () => {
  test.each<[string, BootstrapFailure, boolean, unknown]>([
    ['a 403', 'noAccess', false, new DocsApiError('getDocumentMeta', 403)],
    [
      'InsufficientPermissions',
      'noAccess',
      false,
      new DocsApiError('getDocumentMeta', 422, DocsApiErrorCode.InsufficientPermissions),
    ],
    ['a 404', 'notFound', false, new DocsApiError('getDocumentMeta', 404)],
    ['InvalidID with a 422', 'notFound', false, new DocsApiError('getCommitData', 422, DocsApiErrorCode.InvalidID)],
    ['a 422 with no code', 'bootstrapFailed', true, new DocsApiError('getCommitData', 422)],
    [
      'a 422 with another code',
      'bootstrapFailed',
      true,
      new DocsApiError('getCommitData', 422, DocsApiErrorCode.CommitIdOutOfSync),
    ],
    ['InvalidID', 'notFound', false, new DocsApiError('getDocumentMeta', 400, DocsApiErrorCode.InvalidID)],
    ['no response', 'unreachable', true, new DocsApiError('getDocumentMeta')],
    ['a 500', 'bootstrapFailed', true, new DocsApiError('getDocumentMeta', 500)],
    ['a 429', 'bootstrapFailed', true, new DocsApiError('getValetToken', 429)],
    [
      "Drive's not found, which a user without access gets",
      'noAccess',
      false,
      new ValidationError('Item not found', 2501),
    ],
    ['an error that is not a DocsApiError', 'bootstrapFailed', true, new Error('Drive failed')],
    ['a thrown string', 'bootstrapFailed', true, 'failed'],
  ])('%s is %s, retryable: %s', (_, failure, retryable, error) => {
    expect(classifyBootstrapError(error)).toBe(failure)
    expect(isRetryableBootstrapFailure(failure)).toBe(retryable)
  })
})

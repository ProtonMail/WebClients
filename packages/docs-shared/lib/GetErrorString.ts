import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper'

export function getErrorString(error: any): string | undefined {
  if ('message' in error && error.message && typeof error.message === 'string') {
    return error.message
  } else if (typeof error === 'string') {
    return error
  } else {
    const apiError = getApiError(error)
    if (apiError.message) {
      return apiError.message
    }

    return undefined
  }
}

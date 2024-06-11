import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper'

export function getErrorString(error: unknown): string | undefined {
  if (error instanceof Error) {
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

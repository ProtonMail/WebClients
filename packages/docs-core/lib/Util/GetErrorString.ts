export function getErrorString(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.message
  } else if (typeof error === 'string') {
    return error
  } else {
    return undefined
  }
}

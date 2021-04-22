/**
 * Define wether or not the error comes from a network error
 * We have the ApiError type but we can miss some native connection errors
 * So (unless proven otherwise) the most reliable is to refer on error names
 * Knowing that ApiError also use error names
 */
export const isNetworkError = (error: any) =>
    error.name === 'NetworkError' || error.name === 'OfflineError' || error.name === 'TimeoutError';

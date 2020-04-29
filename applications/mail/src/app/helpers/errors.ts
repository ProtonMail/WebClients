/**
 * Waiting for the API code to be converted in TypeScript
 * Check if the common error is corresponding to an error raised by the API
 */
export const isApiError = (error: Error) =>
    !isNaN((error as any).status) && (error as any).response && (error as any).config;

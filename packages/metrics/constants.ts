/**
 * Maximum number of times an API call
 * will be retried before abandoning the request
 */
export const METRICS_MAX_ATTEMPTS = 10;

/**
 * Time in seconds between retries if `retry-after` response header is empty
 */
export const METRICS_DEFAULT_RETRY_SECONDS = 5;

/**
 * Time in seconds before a request timeouts
 */
export const METRICS_REQUEST_TIMEOUT_SECONDS = 15;

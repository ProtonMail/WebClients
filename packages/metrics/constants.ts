/**
 * Number of metrics to batch into a single request
 * We can technically go up to 1000 on the BE side
 */
export const METRICS_BATCH_SIZE = 100;

/**
 * Time in seconds between metrics requests
 */
export const METRICS_REQUEST_FREQUENCY_SECONDS = 5;

/**
 * Maximum number of failed batch attempts before killing the service
 */
export const METRICS_MAX_JAIL = 3;

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

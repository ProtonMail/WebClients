/**
 * MAX_DOWNLOADING_BLOCKS limits the number of blocks in the buffer of one file
 * transfer before asking API for next blocks.
 */
export const MAX_DOWNLOADING_BLOCKS = 10;

/**
 * MAX_DOWNLOADING_BLOCKS_LOAD limits the number of blocks in the buffer for
 * all download transfers. Once this is reached, no other download is started.
 */
export const MAX_DOWNLOADING_BLOCKS_LOAD = 15;

/**
 * MAX_DOWNLOADING_FILES_LOAD limits the number of files downloaded in parallel.
 * Useful in case we want to allow, lets say up to ten blocks (see constant
 * MAX_DOWNLOADING_BLOCKS_LOAD above), but total number of files should be lower.
 * Real scenario is to limit files when there is multiple of empty ones (having
 * no block file) to avoid fetching all metadata at once.
 */
export const MAX_DOWNLOADING_FILES_LOAD = 15;

/**
 * MAX_RETRIES_BEFORE_FAIL defines how many times download should have been
 * attempted before resulting in failure.
 * It is also controlled by TIME_TO_RESET_RETRIES.
 */
export const MAX_RETRIES_BEFORE_FAIL = 3;

/**
 * TIME_TO_RESET_RETRIES defines after what time the attempt starts from zero.
 * Download can fail also by link expiration and that we don't want to fail
 * but try again and again, until download is fast enough. So only failures
 * happening quickly after each other results in failure.
 * Link expires in 30 minutes. That is the limit to download one 4 MB block.
 */
export const TIME_TO_RESET_RETRIES = 2 * 60 * 1000; // Milliseconds.

/**
 * WAIT_TIME is used for pauses between checks, such as to check if buffer is
 * still full or not, or if the upload is paused, and so on.
 */
export const WAIT_TIME = 50; // Milliseconds.

/**
 * MAX_TOO_MANY_REQUESTS_WAIT defines how many seconds is allowed to wait
 * if server rate limits upload. If server asks to wait longer, we don't
 * wait and fail right away instead.
 */
export const MAX_TOO_MANY_REQUESTS_WAIT = 60 * 60; // Seconds.

/**
 * Amount of time to wait for a new heartbeat. If no progress is done during
 * this interval, we detect download as stuck and it is reported.
 * This time out must be big enough that load of one big folder can fit in.
 * Regular computer can do ~500/minute. We should manage up to 5k items in
 * worst case (that is, only loading, nothing else is happening).
 */
export const HEARTBEAT_WAIT_TIME = 10 * 60 * 1000; // ms

/**
 * Amount of minimal time before timeout is recreated. If download is sending
 * heartbeat too fast, we want to avoid expensive re-creation of setTimeout.
 * This should not be bigger than very small fraction of HEARTBEAT_WAIT_TIME.
 */
export const HEARTBEAT_MAX_REFRESH_TIME = 2 * 1000; // ms

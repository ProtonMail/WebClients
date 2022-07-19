/**
 * How many times failed request is retried before giving up and failing
 * the whole upload.
 */
export const MAX_RETRIES_BEFORE_FAIL = 3;

/**
 * MAX_ENCRYPTED_BLOCKS limits the number of blocks in the buffer before
 * asking API for next batch of links, if not asked sooner by low buffer
 * of uploading blocks.
 */
export const MAX_ENCRYPTED_BLOCKS = 15;

/**
 * MAX_UPLOADING_BLOCKS limits the number of blocks in the buffer for
 * upload. It should be a bit bigger than MAX_UPLOAD_JOBS to ensure that
 * there is always ready next block when any upload job finishes current
 * upload. When there is not enough uploading jobs, worker asks for link
 * creation sooner than it hits the ideal size of MAX_ENCRYPTED_BLOCKS.
 */
export const MAX_UPLOADING_BLOCKS = 10;

/**
 * MAX_BLOCKS_PER_UPLOAD is how many blocks can one upload job have buffered
 * in memory. Used to count the current load for the total limit of ongoing
 * upload files by MAX_UPLOAD_BLOCKS_LOAD.
 */
export const MAX_BLOCKS_PER_UPLOAD = MAX_ENCRYPTED_BLOCKS + MAX_UPLOADING_BLOCKS;

/**
 * MAX_UPLOAD_BLOCKS_LOAD limits the number of total blocks being uploaded
 * at one time. If the queue contains only big files, only few of them at
 * a time is allowed to limit the memory requirements. If the queue contains
 * small files, more can be uploaded in parallel. But each upload mean extra
 * worker. Even though browsers support up to hunderds of web workers, still
 * it spawns threads.
 */
export const MAX_UPLOAD_BLOCKS_LOAD = 10;

/**
 * MAX_UPLOAD_FOLDER_LOAD limits the number of total folder being created
 * at one time.
 */
export const MAX_UPLOAD_FOLDER_LOAD = 5;

/**
 * How many ongoing uploads there can be. Without http2, we cannot do more
 * than six parallel requests to one host. With http2 (which we use), there
 * is theretically no limit, but still we should make a reasonable limit
 * to not kill users device.
 */
export const MAX_UPLOAD_JOBS = 5;

/**
 * WAIT_TIME is used for pauses between checks, such as to check if buffer is
 * still full or not, or if the upload is paused, and so on.
 */
export const WAIT_TIME = 50; // Milliseconds.

/**
 * TOKEN_EXPIRATION_TIME defines after what time server expires the token.
 * We can optimise and not even ask for block upload if we know the token
 * is already old and we should ask for new one.
 */
export const TOKEN_EXPIRATION_TIME = 3 * 60 * 60 * 1000; // Milliseconds.

/**
 * MAX_TOO_MANY_REQUESTS_WAIT defines how many seconds is allowed to wait
 * if server rate limits upload. If server asks to wait longer, we don't
 * wait and fail right away instead.
 */
export const MAX_TOO_MANY_REQUESTS_WAIT = 60 * 60; // Seconds.

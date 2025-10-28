/**
 * MAX_UPLOAD_FOLDER_LOAD limits the number of total folders being created
 * at one time.
 */
export const MAX_UPLOAD_FOLDER_LOAD = 5;

/**
 * MAX_UPLOAD_JOBS limits how many file uploads can run concurrently.
 * With HTTP/2, there's theoretically no limit, but we should make a
 * reasonable limit to not overload the user's device.
 */
export const MAX_UPLOAD_JOBS = 5;

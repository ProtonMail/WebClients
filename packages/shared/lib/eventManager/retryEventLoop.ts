export class RetryEventLoopError extends Error {
    constructor(message: string) {
        super(['Retry event loop error', message].filter(Boolean).join(':'));
        Object.setPrototypeOf(this, RetryEventLoopError.prototype);
    }
}

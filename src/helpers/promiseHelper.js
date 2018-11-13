/**
 * Create cancellation token that can be used to cancel a promise to a function that supports it
 * @return {Object}
 */
export const createCancellationToken = () => {
    let token = false;
    let trigger = () => {};
    const event = new Promise((resolve) => (trigger = resolve));
    return {
        cancel(reason = '') {
            trigger(reason);
            token = true;
        },
        getCancelEvent() {
            return event;
        },
        isCancelled() {
            return token;
        },
        check() {
            if (token) {
                const error = new Error();
                error.isCancellationError = true;
                throw error;
            }
        }
    };
};

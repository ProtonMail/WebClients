/* @ngInject */
function unlockUser(User, askPassword, networkActivityTracker) {
    return () => {
        // Open the open to enter login password because this request require lock scope
        const attemptToUnlock = () => {
            return askPassword().then(({ password, twoFactorCode }) => {
                return networkActivityTracker.track(
                    User.unlock({ Password: password, TwoFactorCode: twoFactorCode })
                ).catch(() => {
                    // error is handled by the networkActivityTracker just retry
                    return attemptToUnlock();
                });
            });
        };

        return attemptToUnlock();
    };
}
export default unlockUser;

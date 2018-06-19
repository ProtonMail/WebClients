/* @ngInject */
function unlockUser(User, askPassword, networkActivityTracker) {
    return () => {
        // Open the open to enter login password because this request require lock scope
        const attemptToUnlock = async () => {
            const { password: Password } = await askPassword(false);
            const promise = User.unlock({ Password });

            return networkActivityTracker.track(promise).catch(attemptToUnlock);
        };

        return attemptToUnlock();
    };
}
export default unlockUser;

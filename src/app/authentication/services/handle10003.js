/* @ngInject */
function handle10003(abuseFraudModal, CONSTANTS) {
    return (data = {}) => {
        if (data.Code === CONSTANTS.ERROR_AUTH_ACCOUNT_DISABLED) {
            abuseFraudModal.activate({
                params: {
                    close() {
                        abuseFraudModal.deactivate();
                    }
                }
            });
        }
    };
}
export default handle10003;

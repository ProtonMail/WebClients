import { API_CUSTOM_ERROR_CODES } from '../../errors';

/* @ngInject */
function handle10003(abuseFraudModal) {
    return (data = {}) => {
        if (data.Code === API_CUSTOM_ERROR_CODES.AUTH_AUTH_ACCOUNT_DISABLED) {
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

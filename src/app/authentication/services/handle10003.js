import { ERROR_AUTH_ACCOUNT_DISABLED } from '../../constants';

/* @ngInject */
function handle10003(abuseFraudModal) {
    return (data = {}) => {
        if (data.Code === ERROR_AUTH_ACCOUNT_DISABLED) {
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

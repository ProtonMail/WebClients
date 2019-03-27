/* @ngInject */
function handle10003(abuseFraudModal) {
    return () => {
        abuseFraudModal.activate({
            params: {
                close() {
                    abuseFraudModal.deactivate();
                }
            }
        });
    };
}
export default handle10003;

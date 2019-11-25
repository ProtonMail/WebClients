import { toParams, process } from '../helpers/paymentToken';
import { isBrowserWithout3DS } from '../../../helpers/browser';

/* @ngInject */
function paymentVerificationModal(pmModal, Payment) {
    const PROCESSING_DELAY = 5000;
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/modals/payment/paymentVerificationModal.tpl.html'),
        /* @ngInject */
        controller: function(params, $scope) {
            const self = this;

            self.step = isBrowserWithout3DS() ? 'duckduckgo' : 'redirect';
            self.payment = params.payment;
            self.isAddCard = params.mode === 'add-card';

            self.cancel = () => {
                const error = new Error('Cancel verification process');
                error.noNotify = true;
                params.onClose(error);
            };

            self.submit = async () => {
                let timeoutID;
                try {
                    $scope.$applyAsync(() => {
                        self.tryAgain = false;
                        self.step = 'redirecting';
                    });
                    timeoutID = setTimeout(() => {
                        $scope.$applyAsync(() => (self.step = 'redirected'));
                    }, PROCESSING_DELAY);
                    await process({
                        Token: params.token,
                        ReturnHost: params.returnHost,
                        paymentApi: Payment,
                        ApprovalURL: params.url
                    });
                    params.onSubmit(toParams(params.body, params.token));
                } catch (error) {
                    clearTimeout(timeoutID);
                    $scope.$applyAsync(() => {
                        self.step = 'fail';
                        if (error.tryAgain) {
                            self.tryAgain = true;
                        }
                    });
                }
            };
        }
    });
}
export default paymentVerificationModal;

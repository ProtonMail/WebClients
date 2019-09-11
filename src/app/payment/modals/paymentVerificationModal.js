import { toParams, process } from '../helpers/paymentToken';

/* @ngInject */
function paymentVerificationModal(pmModal, Payment, gettextCatalog) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/modals/payment/paymentVerificationModal.tpl.html'),
        /* @ngInject */
        controller: function(params, $scope) {
            const self = this;

            self.title = self.loading
                ? gettextCatalog.getString('Payment verification in progress', null, 'Title')
                : gettextCatalog.getString('Payment verification', null, 'Title');

            self.cancel = () => {
                params.onClose(new Error(gettextCatalog.getString('Payment verification modal closed', null, 'Error')));
            };

            self.submit = async () => {
                try {
                    $scope.$applyAsync(() => (self.loading = true));
                    const tab = window.open(params.url);
                    await process({ Token: params.token, paymentApi: Payment, tab });
                    params.onSubmit(toParams(params.body, params.token));
                    $scope.$applyAsync(() => (self.loading = false));
                } catch (error) {
                    $scope.$applyAsync(() => (self.loading = false));
                    params.onClose(error);
                }
            };
        }
    });
}
export default paymentVerificationModal;

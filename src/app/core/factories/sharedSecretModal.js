angular.module('proton.core')
.factory('sharedSecretModal', (pmModal, $timeout) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/twofactor/sharedSecret.tpl.html',
        controller(params) {
            this.sharedSecret = params.sharedSecret;
            this.next = () => {
                if (params.next) {
                    params.next();
                }
            };

            this.cancel = () => {
                if (params.cancel) {
                    params.cancel();
                }
            };

            this.makeCode = () => {
                $timeout(() => {
                    /* eslint no-new: "off" */
                    new QRCode(document.getElementById('qrcode'), params.qrURI);
                }, 0);
            };
        }
    });
});

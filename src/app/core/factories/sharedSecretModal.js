angular.module('proton.core')
.factory('sharedSecretModal', (authentication, pmModal, $timeout, webcrypto) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/twofactor/sharedSecret.tpl.html',
        controller(params) {
            const self = this;
            const randomBytes = webcrypto.getRandomValues(new Uint8Array(20));
            const sharedSecret = base32.encode(randomBytes);
            const primaryAddress = _.find(authentication.user.Addresses, ({ Keys }) => Keys);
            const identifier = (primaryAddress) ? primaryAddress.Email : authentication.user.Name + '@protonmail';
            const qrURI = 'otpauth://totp/' + identifier + '?secret=' + sharedSecret + '&issuer=ProtonMail&algorithm=SHA1&digits=6&period=30';

            self.sharedSecret = params.sharedSecret || sharedSecret;
            self.qrURI = params.qrURI || qrURI;
            self.manual = false;
            self.next = () => params.next(self.sharedSecret, self.qrURI);
            self.cancel = () => params.cancel();
            self.displayManual = () => {
                self.manual = !self.manual;
            };

            self.makeCode = () => {
                $timeout(() => {
                    /* eslint no-new: "off" */
                    new QRCode(document.getElementById('qrcode'), self.qrURI);
                });
            };
        }
    });
});

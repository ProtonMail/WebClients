angular.module('proton.core')
.factory('sharedSecretModal', (authentication, pmModal, $timeout) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/twofactor/sharedSecret.tpl.html',
        controller(params) {
            const randomBytes = window.crypto.getRandomValues(new Uint8Array(20));
            const sharedSecret = base32.encode(randomBytes);
            const primaryAddress = _.find(authentication.user.Addresses, () => true);
            const identifier = (primaryAddress) ? primaryAddress.Email : authentication.user.Name + '@protonmail';
            const qrURI = 'otpauth://totp/' + identifier + '?secret=' + sharedSecret + '&issuer=protonmail&algorithm=SHA1&digits=6&period=30';

            this.sharedSecret = params.sharedSecret || sharedSecret;
            this.qrURI = params.qrURI || qrURI;
            this.manual = false;
            this.displayManual = () => {
                this.manual = !this.manual;
            };
            this.next = () => {
                params.next(this.sharedSecret, this.qrURI);
            };

            this.cancel = () => {
                params.cancel();
            };

            this.makeCode = () => {
                $timeout(() => {
                    /* eslint no-new: "off" */
                    new QRCode(document.getElementById('qrcode'), this.qrURI);
                });
            };
        }
    });
});

import QRCode from 'qrcodejs2';
import _ from 'lodash';

/* @ngInject */
function sharedSecretModal(addressesModel, authentication, pmModal, webcrypto) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/modals/twofactor/sharedSecret.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            const self = this;
            const randomBytes = webcrypto.getRandomValues(new Uint8Array(20));
            const sharedSecret = base32.encode(randomBytes);
            const primaryAddress = _.find(addressesModel.get(), ({ Keys }) => Keys);
            const identifier = primaryAddress ? primaryAddress.Email : `${authentication.user.Name}@protonmail`;
            const qrURI = `otpauth://totp/${identifier}?secret=${sharedSecret}&issuer=ProtonMail&algorithm=SHA1&digits=6&period=30`;

            self.sharedSecret = params.sharedSecret || sharedSecret;
            self.qrURI = params.qrURI || qrURI;
            self.manual = false;
            self.next = () => params.next(self.sharedSecret, self.qrURI);
            self.cancel = () => params.cancel();
            self.displayManual = () => {
                self.manual = !self.manual;
            };

            self.makeCode = () => {
                /* eslint no-new: "off" */
                new QRCode(document.getElementById('qrcode'), self.qrURI);
            };
        }
    });
}
export default sharedSecretModal;

import QRCode from 'qrcodejs2';
import base32 from 'hi-base32';
import _ from 'lodash';
import getRandomValues from 'get-random-values';

/* @ngInject */
function sharedSecretModal(addressesModel, authentication, pmModal) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/modals/twofactor/sharedSecret.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            const randomBytes = getRandomValues(new Uint8Array(20));
            const sharedSecret = base32.encode(randomBytes);
            const primaryAddress = _.find(addressesModel.get(), ({ Keys }) => Keys);
            const identifier = primaryAddress ? primaryAddress.Email : `${authentication.user.Name}@protonmail`;
            const qrURI = `otpauth://totp/${identifier}?secret=${sharedSecret}&issuer=ProtonMail&algorithm=SHA1&digits=6&period=30`;

            this.sharedSecret = params.sharedSecret || sharedSecret;
            this.qrURI = params.qrURI || qrURI;
            this.manual = false;
            this.next = () => params.next(this.sharedSecret, this.qrURI);
            this.displayManual = () => {
                this.manual = !this.manual;
            };

            this.makeCode = () => {
                /* eslint no-new: "off" */
                new QRCode(document.getElementById('qrcode'), this.qrURI);
            };
        }
    });
}
export default sharedSecretModal;

import _ from 'lodash';
import { VERIFICATION_STATUS } from '../../constants';

/* @ngInject */
function attachmentElement(SignatureVerifier, embeddedUtils, dispatchers, attachmentFileFormat) {
    const SIGNATURE_CLASS = {
        [VERIFICATION_STATUS.SIGNED_AND_VALID]: 'listAttachments-signed-ok',
        [VERIFICATION_STATUS.SIGNED_AND_INVALID]: 'listAttachments-signed-fail'
    };

    const UNENCRYPTED_PGP_INLINE_CLASS = 'listAttachments-unencrypted';

    return {
        scope: {
            message: '=',
            attachment: '='
        },
        replace: true,
        templateUrl: require('../../../templates/attachments/attachmentElement.tpl.html'),
        link(scope, el) {
            const { on, unsubscribe } = dispatchers();
            const element = el[0];
            const cid = embeddedUtils.readCID(scope.attachment.Headers);

            const updateSigStatus = () => {
                const verStatus = SignatureVerifier.getVerificationStatus(scope.attachment);
                scope.$applyAsync(() => {
                    const verStatusClass = SIGNATURE_CLASS[verStatus];

                    // Remove old icon classes that do not correspond to the current verification result
                    // not using ... because of IE11
                    _.values(SIGNATURE_CLASS)
                        .filter((c) => c !== verStatusClass)
                        .forEach((className) => element.classList.remove(className));

                    // if the class is verified add the appropriate icon
                    if (verStatusClass) {
                        element.classList.add(verStatusClass);
                    }
                });
            };

            on('attachmentVerified', (e, { type, data: { message = {} } }) => {
                if (type === 'verified' && message.ID === scope.message.ID) {
                    updateSigStatus();
                }
            });

            on('attachmentLoader', (e, { type, data: { attachment = {} } }) => {
                if (type !== 'download' || !cid) {
                    return;
                }
                // check if another attachment with the same cid was loaded the data
                const theirCid = embeddedUtils.readCID(attachment.Headers);
                if (theirCid === cid) {
                    updateSigStatus();
                }
            });

            on('embeddedStore', (e, { type, data: { cid: theirCid = null } }) => {
                if (type !== 'store' || !cid) {
                    return;
                }
                if (theirCid === cid) {
                    updateSigStatus();
                }
            });

            if (scope.message.isPGPInlineEncrypted() && attachmentFileFormat.receivedUnencrypted(scope.attachment)) {
                element.classList.add(UNENCRYPTED_PGP_INLINE_CLASS);
            }

            updateSigStatus();
            scope.$on('$destroy', unsubscribe);
        }
    };
}
export default attachmentElement;

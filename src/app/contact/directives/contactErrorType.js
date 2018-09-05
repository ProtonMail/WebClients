import { CONTACT_ERROR } from '../../constants';

const { TYPE3_CONTACT_VERIFICATION, TYPE2_CONTACT_VERIFICATION, TYPE3_CONTACT_DECRYPTION } = CONTACT_ERROR;

/* @ngInject */
function contactErrorType() {
    const toClass = (key) => `contactErrorType-${key}`;
    const MAP = {
        [TYPE3_CONTACT_VERIFICATION]: toClass('encrypted-verification-error'),
        [TYPE3_CONTACT_DECRYPTION]: toClass('encrypted-error'),
        [TYPE2_CONTACT_VERIFICATION]: toClass('verification-error')
    };

    return {
        restrict: 'A',
        link(scope, el) {
            const checkError = (type) => {
                (scope.contact.errors || []).includes(type) && el[0].classList.add(MAP[type]);
            };

            [TYPE3_CONTACT_VERIFICATION, TYPE3_CONTACT_DECRYPTION, TYPE2_CONTACT_VERIFICATION].forEach(checkError);
        }
    };
}
export default contactErrorType;

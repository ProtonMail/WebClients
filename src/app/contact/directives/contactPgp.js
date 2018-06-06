import _ from 'lodash';

import { PACKAGE_TYPE, RECIPIENT_TYPE, MIME_TYPES, KEY_FLAGS } from '../../constants';

/* @ngInject */
function contactPgp(dispatchers, pmcw, mailSettingsModel) {
    return {
        replace: true,
        templateUrl: require('../../../templates/directives/contact/contactPgp.tpl.html'),
        restrict: 'E',
        scope: {
            model: '=',
            form: '=',
            email: '@',
            internalKeys: '='
        },
        link(scope, ele) {
            const { on, unsubscribe } = dispatchers();
            const element = ele[0];
            const defaultScheme =
                mailSettingsModel.get('PGPScheme') === PACKAGE_TYPE.SEND_PGP_INLINE ? 'pgp-inline' : 'pgp-mime';

            const toggle = (elem, className, value) =>
                elem.classList.contains(className) === value || elem.classList.toggle(className);

            const internalUser = scope.internalKeys.RecipientType === RECIPIENT_TYPE.TYPE_INTERNAL;
            toggle(element, 'pgp-external', !internalUser);
            toggle(element, 'pgp-internal', internalUser);

            const disabledUser =
                internalUser && scope.internalKeys.Keys.every(({ Flags }) => !(Flags & KEY_FLAGS.ENABLE_ENCRYPTION));
            toggle(element, 'pgp-address-disabled', disabledUser);

            const unarmoredKeys = _.map(scope.internalKeys.Keys.filter(({ Send }) => Send), 'PublicKey').map(
                _.flowRight(
                    pmcw.encode_base64,
                    pmcw.arrayToBinaryString,
                    pmcw.stripArmor
                )
            );

            const allKeysExpired = (keys = []) => {
                const keyObjects = keys
                    .map(({ value }) => value.split(','))
                    .map(([, base64 = '']) => base64)
                    .map(pmcw.decode_base64)
                    .map(pmcw.binaryStringToArray)
                    .filter((a) => a.length)
                    .map(pmcw.getKeys);

                return Promise.all(keyObjects.map(([k]) => pmcw.isExpiredKey(k))).then((isExpired) =>
                    isExpired.every((keyExpired) => keyExpired)
                );
            };

            const getEncrypt = () => scope.model.Encrypt && scope.model.Encrypt.length && scope.model.Encrypt[0].value;
            const getSign = () => scope.model.Sign && scope.model.Sign.length && scope.model.Sign[0].value;

            const hasScheme = () => scope.model.Scheme && scope.model.Scheme.length > 0 && !internalUser;
            const schemeValue = () => scope.model.Scheme[0].value.value;
            const isScheme = (scheme) =>
                hasScheme() && (schemeValue() === scheme || (schemeValue() === 'null' && defaultScheme === scheme));
            const isPGPInline = () => isScheme('pgp-inline');
            const isPGPMime = () => isScheme('pgp-mime');

            const fixMimeType = (encrypt, sign) => {
                if (!scope.model || !scope.model.MIMEType) {
                    return;
                }
                if (
                    ((encrypt || sign) && !internalUser) ||
                    (scope.model.MIMEType[0] && scope.model.MIMEType[0].value.value !== MIME_TYPES.PLAINTEXT)
                ) {
                    if (!isScheme('pgp-inline')) {
                        scope.model.MIMEType[0].value = { name: 'Normal', value: 'null' };
                    } else {
                        scope.model.MIMEType[0].value = { name: 'Plain text', value: MIME_TYPES.PLAINTEXT };
                    }
                }
            };

            on('contact.item', (event, { type, data = {} }) => {
                if (type !== 'change') {
                    return;
                }
                scope.$applyAsync(() => {
                    switch (data.type) {
                        case 'Key':
                            allKeysExpired(data.items).then((keysExpired) => {
                                toggle(element, 'pgp-expired', !data.items || keysExpired);
                                toggle(element, 'pgp-no-keys', !_.some(data.items, ({ value }) => value));
                                toggle(
                                    element,
                                    'pgp-no-primary',
                                    !unarmoredKeys.some((k) =>
                                        data.items.map(({ value }) => value.split('base64,')[1]).includes(k)
                                    )
                                );
                            });
                            if (!_.some(data.items, ({ value }) => value)) {
                                scope.model.Encrypt[0].value = false;
                            }
                            break;
                        case 'Scheme':
                            toggle(element, 'pgp-inline', isPGPInline());
                            toggle(element, 'pgp-mime', isPGPMime());
                            fixMimeType(getEncrypt(), getSign());
                            break;
                        case 'Encrypt': {
                            const encrypt = data.items[0].value;
                            if (encrypt && !_.some(data.items, ({ value }) => value)) {
                                data.items[0].value = false;
                                return;
                            }
                            toggle(element, 'pgp-encrypt', encrypt);
                            fixMimeType(encrypt, getSign());
                            if (encrypt) {
                                scope.model.Sign[0].value = true;
                                toggle(element, 'pgp-sign', true);
                            }
                            break;
                        }
                        case 'Sign': {
                            const sign = data.items[0].value;
                            toggle(element, 'pgp-sign', sign);
                            fixMimeType(getEncrypt(), sign);
                            break;
                        }
                    }
                });
            });

            // Get keys or [], can be undefined when advanced settings are toggled on a contact which you added an external email address
            const keys = scope.model.Key || [];

            allKeysExpired(keys).then((keysExpired) => toggle(element, 'pgp-expired', !scope.model.Key || keysExpired));
            toggle(element, 'pgp-no-keys', !_.some(keys, ({ value }) => value));
            toggle(
                element,
                'pgp-no-primary',
                !unarmoredKeys.some((k) => keys.map(({ value }) => value.split('base64,')[1]).includes(k))
            );
            toggle(element, 'pgp-inline', isPGPInline());
            toggle(element, 'pgp-mime', isPGPMime());
            toggle(element, 'pgp-encrypt', getEncrypt());
            toggle(element, 'pgp-sign', getSign());
            fixMimeType(getEncrypt(), getSign());

            scope.$on('$destroy', () => {
                unsubscribe();
            });
        }
    };
}
export default contactPgp;

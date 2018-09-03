import { toggle } from '../../../helpers/domHelper';

/* @ngInject */
function contactPgp(dispatchers, contactPgpModel) {
    return {
        replace: true,
        templateUrl: require('../../../templates/directives/contact/contactPgp.tpl.html'),
        restrict: 'E',
        require: '^form',
        scope: {
            model: '=',
            form: '=',
            email: '@',
            internalKeys: '='
        },
        link(scope, el, attr, ngFormController) {
            const { on, unsubscribe } = dispatchers(['advancedSetting']);
            const element = el[0];

            on('advancedSetting', (event, { type, data = {} }) => {
                switch (type) {
                    case 'updateKeys': {
                        const unarmoredKeys = contactPgpModel.getRawInternalKeys();

                        contactPgpModel.allKeysExpired(data.keys).then((keysExpired) => {
                            toggle(element, 'pgp-expired', !data.keys.length || keysExpired);
                            toggle(element, 'pgp-no-keys', !data.keys.length);
                            toggle(
                                element,
                                'pgp-no-primary',
                                !unarmoredKeys.some((k) =>
                                    data.keys.map((value) => value.split('base64,')[1]).includes(k)
                                )
                            );
                        });
                        break;
                    }
                    case 'updateScheme':
                        toggle(element, 'pgp-inline', contactPgpModel.isPGPInline());
                        toggle(element, 'pgp-mime', contactPgpModel.isPGPMime());
                        break;
                    case 'updateEncrypt': {
                        const encrypt = data.status;
                        toggle(element, 'pgp-encrypt', encrypt);
                        if (encrypt) {
                            toggle(element, 'pgp-sign', true);
                        }
                        ngFormController.$setDirty();
                        break;
                    }
                    case 'updateSign': {
                        toggle(element, 'pgp-sign', data.status);
                        ngFormController.$setDirty();
                        break;
                    }
                    default:
                        break;
                }
            });

            contactPgpModel.init(scope.model, scope.email, scope.internalKeys);
            const internalUser = contactPgpModel.isInternalUser();
            const disabledUser = contactPgpModel.isDisabledUser();
            const keys = contactPgpModel.get('Keys');
            const unarmoredKeys = contactPgpModel.getRawInternalKeys();

            toggle(element, 'pgp-external', !internalUser);
            toggle(element, 'pgp-internal', internalUser);
            toggle(element, 'pgp-address-disabled', disabledUser);
            contactPgpModel.allKeysExpired(keys).then((keysExpired) => toggle(element, 'pgp-expired', keysExpired));
            toggle(element, 'pgp-no-keys', !keys.length);
            toggle(
                element,
                'pgp-no-primary',
                !unarmoredKeys.some((k) => keys.map((value) => value.split('base64,')[1]).includes(k))
            );
            toggle(element, 'pgp-inline', contactPgpModel.isPGPInline());
            toggle(element, 'pgp-mime', contactPgpModel.isPGPMime());
            toggle(element, 'pgp-encrypt', contactPgpModel.get('Encrypt'));
            toggle(element, 'pgp-sign', contactPgpModel.get('Sign'));

            scope.$on('$destroy', () => {
                unsubscribe();
            });
        }
    };
}
export default contactPgp;

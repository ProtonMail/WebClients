import { toggle } from '../../../helpers/domHelper';

/* @ngInject */
function contactPgp(dispatchers, contactPgpModel) {
    const updateKeys = async (element, keys = []) => {
        const [unarmoredKeys, keysExpired] = await Promise.all([
            contactPgpModel.getRawInternalKeys(),
            contactPgpModel.allKeysExpired(keys)
        ]);

        toggle(element, 'pgp-expired', !keys.length || keysExpired);
        toggle(element, 'pgp-no-keys', !keys.length);
        toggle(
            element,
            'pgp-no-primary',
            !unarmoredKeys.some((k) => keys.map((value) => value.split('base64,')[1]).includes(k))
        );
        toggle(element, 'pgp-encrypt', contactPgpModel.get('Encrypt'));
    };

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
                        updateKeys(element, data.keys);
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
            const externalUser = contactPgpModel.isExternalUser();
            const hasKeys = contactPgpModel.hasKeys();
            const disabledUser = contactPgpModel.isDisabledUser();

            /**
             * Special case for external user with keys where the scheme selector should be displayed.
             * Right now an external user with keys is treated as an internal user, since it uses css
             * to hide/show classes. This overrides that for the scheme selector to always show it for
             * external users.
             */
            scope.isExternal = externalUser;

            toggle(element, 'pgp-external', externalUser && !hasKeys);
            toggle(element, 'pgp-internal', internalUser || (externalUser && hasKeys));
            toggle(element, 'pgp-address-disabled', disabledUser);
            toggle(element, 'pgp-inline', contactPgpModel.isPGPInline());
            toggle(element, 'pgp-mime', contactPgpModel.isPGPMime());
            toggle(element, 'pgp-encrypt', contactPgpModel.get('Encrypt'));
            toggle(element, 'pgp-sign', contactPgpModel.get('Sign'));

            updateKeys(element, contactPgpModel.get('Keys'));

            scope.$on('$destroy', () => {
                unsubscribe();
            });
        }
    };
}
export default contactPgp;

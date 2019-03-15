import _ from 'lodash';

import { PACKAGE_TYPE, CONTACT_SETTINGS_DEFAULT } from '../../constants';

const PGP_INLINE = 'PGP/Inline';
const PGP_MIME = 'PGP/MIME';

/* @ngInject */
function contactSchemeSelector(dispatchers, gettextCatalog, mailSettingsModel, translator) {
    const I18N = translator(() => ({
        noScheme: gettextCatalog.getString('Use global default', null, 'Default encryption scheme')
    }));

    return {
        require: '^form',
        scope: {
            form: '=',
            model: '='
        },
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/contact/contactSchemeSelector.tpl.html'),
        link(scope, el, attr, ngFormController) {
            const defaultValue =
                mailSettingsModel.get('PGPScheme') === PACKAGE_TYPE.SEND_PGP_INLINE ? PGP_INLINE : PGP_MIME;
            const { dispatcher, on, unsubscribe } = dispatchers(['advancedSetting']);
            const set = (value) => (scope.scheme = _.find(scope.options, { value }));

            scope.options = [
                { value: CONTACT_SETTINGS_DEFAULT, label: `${I18N.noScheme} (${defaultValue})` },
                { value: 'pgp-mime', label: PGP_MIME },
                { value: 'pgp-inline', label: PGP_INLINE }
            ];

            scope.onChange = () => {
                dispatcher.advancedSetting('updateScheme', { value: scope.scheme.value });
                ngFormController.$setDirty();
            };

            on('advancedSetting', (e, { type, data = {} }) => {
                if (type === 'update') {
                    scope.$applyAsync(() => {
                        set(data.model.Scheme);
                    });
                }
            });

            set(scope.model);

            scope.$on('$destroy', () => {
                unsubscribe();
            });
        }
    };
}
export default contactSchemeSelector;

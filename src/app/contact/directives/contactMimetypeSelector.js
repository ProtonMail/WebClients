import _ from 'lodash';

import { CONTACT_SETTINGS_DEFAULT, MIME_TYPES } from '../../constants';

/* @ngInject */
function contactMimetypeSelector(dispatchers, gettextCatalog) {
    const I18N = {
        htmlMimeType: gettextCatalog.getString('Automatic', null, 'MIME type'),
        plaintextMimeType: gettextCatalog.getString('Plain Text', null, 'MIME type')
    };

    return {
        require: '^form',
        scope: {
            form: '=',
            model: '='
        },
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/contact/contactMimetypeSelector.tpl.html'),
        link(scope, el, attr, ngFormController) {
            const { dispatcher, on, unsubscribe } = dispatchers(['advancedSetting']);
            const set = (value) => (scope.mimetype = _.find(scope.options, { value }));

            scope.options = [
                { value: CONTACT_SETTINGS_DEFAULT, label: I18N.htmlMimeType },
                { value: MIME_TYPES.PLAINTEXT, label: I18N.plaintextMimeType }
            ];

            scope.onChange = () => {
                dispatcher.advancedSetting('updateMIMEType', { value: scope.mimetype.value });
                ngFormController.$setDirty();
            };

            on('advancedSetting', (e, { type, data = {} }) => {
                if (type === 'update') {
                    scope.$applyAsync(() => {
                        set(data.model.MIMEType);
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
export default contactMimetypeSelector;

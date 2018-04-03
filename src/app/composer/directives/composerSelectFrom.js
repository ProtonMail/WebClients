import { isIE11 } from '../../../helpers/browser';

/* @ngInject */
function composerSelectFrom(notification, editorModel, gettextCatalog, composerFromModel, premiumDomainModel) {
    const I18N = {
        upgradeRequired() {
            return gettextCatalog.getString(
                'Upgrade to a paid plan to send from your {{email}} address',
                { email: premiumDomainModel.email() },
                'Error'
            );
        }
    };

    return {
        scope: {
            message: '=model'
        },
        replace: true,
        templateUrl: require('../../../templates/directives/composer/composerSelectFrom.tpl.html'),
        link(scope, el) {
            const $select = el.find('select');
            const { addresses } = composerFromModel.get(scope.message);
            let previousAddress = scope.message.From;

            scope.addresses = addresses;

            const onChange = () => {
                if (scope.message.From.Send === 0) {
                    scope.$applyAsync(() => {
                        scope.message.From = previousAddress;
                    });
                    return notification.error(I18N.upgradeRequired());
                }

                scope.$applyAsync(() => {
                    previousAddress = scope.message.From;
                    const { editor } = editorModel.find(scope.message);
                    editor.fireEvent('refresh', { action: 'message.changeFrom' });
                });
            };

            /**
             * For some reason IE focus is lost
             * cause a rendering bug of the options widths
             */
            const onMouseDown = () => $select.focus();
            isIE11() && $select.on('mousedown', onMouseDown);

            $select.on('change', onChange);

            scope.$on('$destroy', () => {
                isIE11() && $select.off('mousedown', onMouseDown);
                $select.off('change', onChange);
            });
        }
    };
}
export default composerSelectFrom;

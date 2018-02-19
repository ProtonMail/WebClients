import { isIE11 } from '../../../helpers/browser';

/* @ngInject */
function composerSelectFrom(notification, editorModel, gettextCatalog, composerFromModel, authentication) {
    const I18N = {
        ATTACHMENT_SEND_CHANGE: gettextCatalog.getString(
            'Attachments and inline images must be removed first before changing sender',
            null,
            'Compose message'
        ),
        upgradeRequired() {
            return gettextCatalog.getString(
                'Upgrade to a paid plan to send from your {{name}}@pm.me address',
                { name: authentication.user.Name },
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

            const onClick = (e) => {
                if (scope.message.Attachments.length) {
                    e.preventDefault();
                    return notification.error(I18N.ATTACHMENT_SEND_CHANGE);
                }
            };

            const onChange = () => {
                if (scope.message.From.Send === 0) {
                    scope.$applyAsync(() => {
                        scope.message.From = previousAddress;
                    });
                    return notification.error(I18N.upgradeRequired());
                }

                scope.$applyAsync(() => {
                    previousAddress = scope.message.From;
                    scope.message.AddressID = scope.message.From.ID;
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

            el.on('click', onClick);
            $select.on('change', onChange);

            scope.$on('$destroy', () => {
                isIE11() && $select.off('mousedown', onMouseDown);
                el.off('click', onClick);
                $select.off('change', onChange);
            });
        }
    };
}
export default composerSelectFrom;

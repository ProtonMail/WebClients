/* @ngInject */
function readReceiptPanel(gettextCatalog, networkActivityTracker, notification, readReceiptModel) {
    return {
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/message/readReceiptPanel.tpl.html'),
        link(scope, el) {
            const I18N = {
                success: gettextCatalog.getString('Read receipt sent', null, 'Success notification')
            };

            const $button = el.find('.readReceiptPanel-button');

            const onClick = async () => {
                const promise = readReceiptModel.sendConfirmation(scope.message);
                await networkActivityTracker.track(promise);
                notification.success(I18N.success);
            };

            $button.on('click', onClick);

            scope.$on('$destroy', () => {
                $button.off('click', onClick);
            });
        }
    };
}
export default readReceiptPanel;

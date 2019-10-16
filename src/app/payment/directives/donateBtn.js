/* @ngInject */
function donateBtn(gettextCatalog, notification, donateModal, paymentModel, translator) {
    const I18N = translator(() => ({
        notAvailable: gettextCatalog.getString(
            'Donations are currently not available, please try again later',
            null,
            'Info'
        )
    }));

    return {
        restrict: 'A',
        link(scope, el) {
            const onClick = async () => {
                if (!(await paymentModel.canPay())) {
                    return notification.info(I18N.notAvailable);
                }
                donateModal.activate();
            };

            el.on('click', onClick);

            scope.$on('$destroy', () => {
                el.off('click', onClick);
            });
        }
    };
}
export default donateBtn;

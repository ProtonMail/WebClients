/* @ngInject */
function reactivateKeysBtn(
    dispatchers,
    oldPasswordModal,
    gettextCatalog,
    reactivateKeys,
    networkActivityTracker,
    notification
) {
    const I18N = {
        success: gettextCatalog.getString('Keys reactivated', null, 'Success'),
        reactivateKeys: gettextCatalog.getString('Reactivate keys', null, 'Action')
    };
    const { dispatcher } = dispatchers(['keys']);

    return {
        replace: true,
        scope: {
            contact: '<'
        },
        template: `<button class="reactivateKeysBtn-container pm_button">${I18N.reactivateKeys}</button>`,
        restrict: 'E',
        link(scope, el) {
            const onClick = () => {
                oldPasswordModal.activate({
                    params: {
                        async submit(password) {
                            const addressesWithKeys = await reactivateKeys.get(); // Get the keys dynamically since they can change.
                            oldPasswordModal.deactivate();
                            const promise = reactivateKeys
                                .process(addressesWithKeys, password)
                                .then(({ success, failed }) => {
                                    dispatcher.keys('reactivate', { contact: scope.contact });
                                    success && notification.success(success);
                                    failed && notification.error(failed);
                                });

                            networkActivityTracker.track(promise);
                        },
                        cancel() {
                            oldPasswordModal.deactivate();
                        }
                    }
                });
            };

            el.on('click', onClick);

            scope.$on('$destroy', () => {
                el.off('click', onClick);
            });
        }
    };
}
export default reactivateKeysBtn;

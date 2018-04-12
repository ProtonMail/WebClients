import _ from 'lodash';
/* @ngInject */
function reactivateKeysBtn(
    authentication,
    addressesModel,
    oldPasswordModal,
    gettextCatalog,
    reactivateKeys,
    networkActivityTracker,
    notification
) {
    const I18N = {
        success: gettextCatalog.getString('Keys reactivated', null, 'Success'),
        reactivateContact: gettextCatalog.getString('Reactivate contact keys', null, 'Action'),
        reactivateAddress: gettextCatalog.getString('Reactivate address keys', null, 'Action')
    };

    const getKeys = (mode) => {
        if (mode === 'contact') {
            const { Keys = [] } = authentication.user;
            return Keys.filter(({ decrypted }) => !decrypted);
        }

        if (mode === 'address') {
            return _.reduce(
                addressesModel.get(),
                (acc, { Keys = [] }) => {
                    return acc.concat(Keys.filter(({ decrypted }) => !decrypted));
                },
                []
            );
        }

        return [];
    };

    return {
        replace: true,
        scope: {},
        template: `<button class="reactivateUserKeysBtn-container pm_button">${I18N.reactivateContact}</button>`,
        restrict: 'E',
        link(scope, el, { mode }) {
            if (mode === 'address') {
                el[0].textContent = I18N.reactivateAddress;
            }

            const onClick = () => {
                oldPasswordModal.activate({
                    params: {
                        submit(password) {
                            const keys = getKeys(mode); // Get the keys dynamically since they can change.
                            oldPasswordModal.deactivate();
                            const promise = reactivateKeys(keys, password).then(({ success, failed }) => {
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

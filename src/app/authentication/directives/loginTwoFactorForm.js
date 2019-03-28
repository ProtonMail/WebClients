/* @ngInject */
const loginTwoFactorForm = (helpLoginModal, translator, gettextCatalog, notification) => {
    const I18N = translator(() => ({
        TWOFA_ERROR: gettextCatalog.getString('Please enter your two-factor passcode', null, 'Error')
    }));

    return {
        replace: true,
        templateUrl: require('../../../templates/authentication/loginTwoFactorForm.tpl.html'),
        scope: {
            onSubmit: '<',
            loading: '<'
        },
        link(scope, $el) {
            _rAF(() => $el[0].querySelector('#twoFactorCode').focus());

            const onSubmit = (e) => {
                e.preventDefault();
                e.stopPropagation();

                const totp = e.target.twoFactorCode.value;
                if (!totp) {
                    return notification.error(I18N.TWOFA_ERROR);
                }
                scope.onSubmit({ totp });
            };

            const onClick = (e) => {
                if (e.target.dataset.action === 'help') {
                    helpLoginModal.activate({
                        params: {
                            close() {
                                helpLoginModal.deactivate();
                            }
                        }
                    });
                }
            };

            $el.on('click', onClick);
            $el.on('submit', onSubmit);

            scope.$on('$destroy', () => {
                $el.off('click', onClick);
                $el.off('submit', onSubmit);
            });
        }
    };
};
export default loginTwoFactorForm;

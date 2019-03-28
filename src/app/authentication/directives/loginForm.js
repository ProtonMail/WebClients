/* @ngInject */
const loginForm = (helpLoginModal, gettextCatalog, translator, notification) => {
    const I18N = translator(() => ({
        USERNAME_PASSWORD_ERROR: gettextCatalog.getString(
            'Please enter your username and password',
            null,
            'Login error'
        )
    }));

    return {
        replace: true,
        templateUrl: require('../../../templates/authentication/loginForm.tpl.html'),
        scope: {
            username: '=',
            onSubmit: '<',
            loading: '<'
        },
        link(scope, $el) {
            _rAF(() => $el[0].querySelector(scope.username.length ? '#password' : '#username').focus());

            const onSubmit = (e) => {
                e.preventDefault();
                e.stopPropagation();

                const username = e.target.username.value;
                const password = e.target.password.value;
                if (!username || !password) {
                    return notification.error(I18N.USERNAME_PASSWORD_ERROR);
                }
                scope.onSubmit({
                    username,
                    password
                });
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
export default loginForm;

/* @ngInject */
const loginUnlockForm = ($state, translator, gettextCatalog, notification) => {
    const I18N = translator(() => ({
        PASSWORD_ERROR: gettextCatalog.getString('Please enter your mailbox password', null, 'Error')
    }));

    return {
        replace: true,
        templateUrl: require('../../../templates/authentication/loginUnlock.tpl.html'),
        scope: {
            onSubmit: '<',
            loading: '<'
        },
        link(scope, $el) {
            _rAF(() => $el[0].querySelector('#mailboxPassword').focus());

            const onSubmit = (e) => {
                e.preventDefault();
                e.stopPropagation();

                const password = e.target.mailboxPassword.value;
                if (!password) {
                    return notification.error(I18N.PASSWORD_ERROR);
                }
                scope.onSubmit({ password });
            };

            const onClick = (e) => {
                if (e.target.dataset.action === 'reset') {
                    $state.go('support.reset-password');
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
export default loginUnlockForm;

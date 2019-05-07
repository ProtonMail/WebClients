/* @ngInject */
function signupUserForm(confirmModal, dispatchers, gettextCatalog, translator, iframeVerifWizard, notification) {
    const I18N = translator(() => ({
        TITLE: gettextCatalog.getString('Warning', null, 'Title'),
        MESSAGE: gettextCatalog.getString(
            'Warning: You did not set a recovery email so account recovery is impossible if you forget your password. Proceed without recovery email?',
            null,
            'Warning'
        ),
        ERROR_NO_USERNAME: gettextCatalog.getString('Invalid username', null, 'Error')
    }));

    async function saveCredentials({ login = {}, username }) {
        if (!navigator.credentials) {
            return; // Feature not available
        }

        try {
            const cred = new window.PasswordCredential({
                id: username,
                password: login.password
            });
            // osef if it fails
            await navigator.credentials.store(cred);
        } catch (e) {
            console.log('--- debug ---');
            console.log(e);
            // Firefox will crash because it thinks publicKey is mandatory inside cred.
            // Even if the spec says otherwise
            // Current API inside Firefox 🍻 🤣
        }
    }

    return {
        replace: true,
        scope: {
            domains: '=',
            account: '='
        },
        templateUrl: require('../../../templates/user/signupUserForm.tpl.html'),
        link(scope, el) {
            const { dispatcher, on, unsubscribe } = dispatchers(['signup']);
            const $username = el[0].querySelector('input[name="username"]');

            const send = (data, payload) => {
                $username.value = data.username;
                return () => {
                    const account = {
                        ...scope.account,
                        ...data,
                        domain: {
                            label: data.domain,
                            value: data.domain
                        },
                        payload
                    };
                    saveCredentials(account);
                    dispatcher.signup('userform.submit', account);
                };
            };

            const onSubmit = ({ user = {}, data }) => {
                if (!user.username) {
                    return notification.error(I18N.ERROR_NO_USERNAME);
                }

                // Force validation, ex if we press Enter from the username field
                scope.accountForm.$setSubmitted();

                // $invalid is set post Async check, valid is always here.
                if (!scope.accountForm.$valid) {
                    return el[0].querySelector('.ng-invalid').focus();
                }

                const submit = send(user, data);

                if (user.notificationEmail) {
                    return submit();
                }

                confirmModal.activate({
                    params: {
                        title: I18N.TITLE,
                        message: I18N.MESSAGE,
                        confirm() {
                            submit();
                            confirmModal.deactivate();
                        },
                        cancel() {
                            confirmModal.deactivate();
                            el.find('#notificationEmail').focus();
                        }
                    }
                });
            };

            on('signup', (e, { type, data }) => {
                if (type === 'iframe.message') {
                    scope.$applyAsync(() => {
                        onSubmit(data);
                    });
                }
            });

            // Register a custom iframe listener with a namespace
            const wizard = iframeVerifWizard('signupUserForm');
            const unsubscribeIframe = wizard.listen();
            el.on('submit', wizard.triggerSubmit);

            scope.$on('$destroy', () => {
                unsubscribe();
                unsubscribeIframe();
                el.off('submit', wizard.triggerSubmit);
            });
        }
    };
}
export default signupUserForm;

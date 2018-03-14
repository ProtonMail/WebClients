import { INVITE_MAIL } from '../../constants';

/* @ngInject */
function signupUserForm(confirmModal, gettextCatalog, signupModel, $rootScope) {
    const I18N = {
        TITLE: gettextCatalog.getString('Warning', null, 'Title'),
        MESSAGE: gettextCatalog.getString(
            'Warning: You did not set a recovery email so account recovery is impossible if you forget your password. Proceed without recovery email?',
            null,
            'Warning'
        )
    };

    return {
        replace: true,
        scope: {
            domains: '=',
            plans: '=',
            account: '='
        },
        templateUrl: require('../../../templates/user/signupUserForm.tpl.html'),
        link(scope, el) {
            const send = () => {
                // Save variables to prevent extensions/etc
                // from modifying them during setup process
                signupModel.store(scope.account);
                signupModel.set('Type', INVITE_MAIL);

                $rootScope.$emit('signup', {
                    type: 'userform.submit',
                    data: {
                        form: scope.account
                    }
                });
            };

            const onSubmit = (e) => {
                e.preventDefault();

                if (scope.accountForm.$invalid) {
                    return el[0].querySelector('.ng-invalid').focus();
                }

                if (scope.account.notificationEmail) {
                    return send();
                }

                confirmModal.activate({
                    params: {
                        title: I18N.TITLE,
                        message: I18N.MESSAGE,
                        confirm() {
                            send();
                            confirmModal.deactivate();
                        },
                        cancel() {
                            confirmModal.deactivate();
                            el.find('#notificationEmail').focus();
                        }
                    }
                });
            };

            el.on('submit', onSubmit);

            scope.$on('$destroy', () => {
                el.off('submit', onSubmit);
            });
        }
    };
}
export default signupUserForm;

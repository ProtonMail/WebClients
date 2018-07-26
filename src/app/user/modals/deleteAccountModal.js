import { CLIENT_TYPE } from '../../constants';

/* @ngInject */
function deleteAccountModal(
    addressesModel,
    pmModal,
    Report,
    User,
    networkActivityTracker,
    authentication,
    $state,
    gettextCatalog,
    notification,
    userSettingsModel,
    userType
) {
    const I18N = {
        invalidForm: gettextCatalog.getString(
            'Invalid email address or password',
            null,
            'Error reported when the delete account form is invalid'
        )
    };
    async function report(params, isAdmin) {
        if (isAdmin) {
            return Report.bug(params);
        }
    }

    function deleteUser(params) {
        return User.delete(params).then(({ data = {} }) => data);
    }

    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/modals/deleteAccount.tpl.html'),
        /* @ngInject */
        controller: function(params, $scope) {
            this.hasTwoFactor = userSettingsModel.get('TwoFactor');
            this.isAdmin = userType().isAdmin;
            this.cancel = params.close;
            this.email = '';
            this.feedback = '';
            this.password = '';
            this.twoFactorCode = '';
            this.submit = () => {
                if ($scope.deleteForm.$invalid) {
                    return notification.error(I18N.invalidForm);
                }

                const username = authentication.user.Name;
                const { Email } = addressesModel.getFirst();
                const params = {
                    OS: '--',
                    OSVersion: '--',
                    Browser: '--',
                    BrowserVersion: '--',
                    BrowserExtensions: '--',
                    Client: '--',
                    ClientVersion: '--',
                    ClientType: CLIENT_TYPE,
                    Title: `[DELETION FEEDBACK] ${username}`,
                    Username: username,
                    Email: this.email || Email,
                    Description: this.feedback
                };

                const promise = deleteUser({ Password: this.password, TwoFactorCode: this.twoFactorCode })
                    .then(() => report(params, this.isAdmin))
                    .then(() => $state.go('login'));

                networkActivityTracker.track(promise);
            };
        }
    });
}
export default deleteAccountModal;

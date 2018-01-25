import { CONSTANTS } from '../../constants';

/* @ngInject */
function deleteAccountModal(
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
    const { CLIENT_TYPE } = CONSTANTS;
    const I18N = {
        invalidForm: gettextCatalog.getString('Invalid email address or password', null, 'Error reported when the delete account form is invalid')
    };
    async function report(params, isAdmin) {
        if (isAdmin) {
            return Report.bug(params);
        }
    }

    function deleteUser(params) {
        return User.delete(params).then(({ data = {} }) => {
            if (data.Code === 1000) {
                return data;
            }
            throw new Error(data.Error);
        });
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
                    notification.error(I18N.invalidForm);
                    return;
                }

                const username = authentication.user.Name;
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
                    Email: this.email || authentication.user.Addresses[0].Email,
                    Description: this.feedback
                };

                const promise = report(params, this.isAdmin)
                    .then(() => deleteUser({ Password: this.password, TwoFactorCode: this.twoFactorCode }))
                    .then(() => $state.go('login'));

                networkActivityTracker.track(promise);
            };
        }
    });
}
export default deleteAccountModal;

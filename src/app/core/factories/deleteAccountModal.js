angular.module('proton.core')
.factory('deleteAccountModal', (pmModal, Bug, User, networkActivityTracker, authentication, $state, CONSTANTS) => {
    function report(params, isAdmin) {
        if (isAdmin) {
            return Bug.report(params);
        }
        return Promise.resolve();
    }

    function deleteUser(params) {
        return User.delete(params)
            .then(({ data = {} }) => {
                if (data.Code === 1000) {
                    return data;
                }
                throw new Error(data.Error);
            });
    }

    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/deleteAccount.tpl.html',
        controller(params) {
            const self = this;
            self.hasTwoFactor = authentication.user.TwoFactor;
            self.isAdmin = authentication.user.Role === CONSTANTS.PAID_ADMIN_ROLE;
            self.email = '';
            self.feedback = '';
            self.password = '';
            self.twoFactorCode = '';
            self.submit = () => {
                const username = authentication.user.Name;
                const params = {
                    OS: '--',
                    OSVersion: '--',
                    Browser: '--',
                    BrowserVersion: '--',
                    BrowserExtensions: '--',
                    Client: '--',
                    ClientVersion: '--',
                    Title: `[DELETION FEEDBACK] ${username}`,
                    Username: username,
                    Email: self.email || authentication.user.Addresses[0].Email,
                    Description: self.feedback
                };

                const promise = report(params, self.isAdmin)
                    .then(() => deleteUser({ Password: self.password, TwoFactorCode: self.twoFactorCode }))
                    .then(() => $state.go('login'));

                networkActivityTracker.track(promise);
            };
            self.cancel = () => {
                params.close();
            };
        }
    });
});

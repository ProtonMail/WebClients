angular.module('proton.core')
.factory('deleteAccountModal', (pmModal, Bug, User, networkActivityTracker, authentication, $state, CONSTANTS) => {
    function analyse(data = {}, check = true) {
        if (check) {
            if (data.Code === 1000) {
                return Promise.resolve();
            } else if (data.Error) {
                return Promise.reject(data.Error);
            }
            return Promise.reject('Error');
        }
        return Promise.resolve();
    }
    function report(params, isAdmin) {
        if (isAdmin) {
            return Bug.report(params);
        }
        return Promise.resolve();
    }
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/deleteAccount.tpl.html',
        controller(params) {
            const self = this;
            self.isAdmin = authentication.user.Role === CONSTANTS.PAID_ADMIN;
            self.feedback = '';
            self.password = '';
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
                    Email: '--',
                    Description: self.feedback
                };
                const promise = report(params, self.isAdmin)
                .then((data) => analyse(data, self.isAdmin))
                .then(() => User.delete({ Password: self.password }))
                .then(({ data = {} }) => analyse(data))
                .then(() => $state.go('login'));
                networkActivityTracker.track(promise);
            };
            self.cancel = () => {
                params.close();
            };
        }
    });
});

angular.module('proton.core')
.factory('deleteAccountModal', (pmModal, Bug, User, networkActivityTracker, authentication, $state) => {
    function analyse(data = {}) {
        if (data.Code === 1000) {
            return Promise.resolve();
        } else if (data.Error) {
            return Promise.reject(data.Error);
        }
        return Promise.reject('Error');
    }
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/deleteAccount.tpl.html',
        controller(params) {
            const self = this;
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
                const promise = Bug.report(params)
                .then((data) => analyse(data))
                .then(() => User.delete({ Password: self.password }))
                .then((data) => analyse(data))
                .then(() => $state.go('login'));
                networkActivityTracker.track(promise);
            };
            self.cancel = () => {
                params.close();
            };
        }
    });
});

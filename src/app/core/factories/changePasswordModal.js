angular.module('proton.core')
.factory('changePasswordModal', (authentication, changeMailboxPassword, networkActivityTracker, pmModal, Setting, User) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/changePassword.tpl.html',
        controller(params) {
            const self = this;
            const { type = '', phase = 0, close } = params;
            const promises = {
                password: () => changeMailboxPassword({ newPassword: self.newPassword, onePassword: true }),
                login: () => Setting.password(self.newPassword),
                mailbox: () => changeMailboxPassword({ newPassword: self.newPassword, onePassword: false })
            };
            self.mode = authentication.user.PasswordMode;
            self.type = type;
            self.newPassword = '';
            self.confirmPassword = '';
            self.submit = () => {
                const promise = promises[type]()
                .then(() => ((phase === 1) ? Promise.resolve() : User.lock()))
                .then(() => close());
                networkActivityTracker.track(promise);
            };
            self.cancel = () => {
                const promise = User.lock().then(() => close());
                networkActivityTracker.track(promise);
            };
        }
    });
});

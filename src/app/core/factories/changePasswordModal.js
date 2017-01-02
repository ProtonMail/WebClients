angular.module('proton.core')
.factory('changePasswordModal', (authentication, changeMailboxPassword, changeOrganizationPassword, eventManager, gettextCatalog, networkActivityTracker, notify, pmModal, Setting, User) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/changePassword.tpl.html',
        controller(params) {
            const self = this;
            const { type = '', phase = 0, close, creds, organizationKey } = params;
            const promises = {
                password: () => changeMailboxPassword({ newPassword: self.newPassword, onePassword: true }),
                login: () => Setting.password(self.newPassword),
                mailbox: () => changeMailboxPassword({ newPassword: self.newPassword, onePassword: false }),
                organization: () => changeOrganizationPassword({ newPassword: self.newPassword, creds, organizationKey })
            };
            self.mode = authentication.user.PasswordMode;
            self.type = type;
            self.newPassword = '';
            self.confirmPassword = '';
            self.submit = () => {
                const next = phase === 1;
                const promise = promises[type]()
                .then(() => ((next) ? Promise.resolve() : User.lock()))
                .then(() => eventManager.call())
                .then(() => {
                    const message = gettextCatalog.getString('Password updated', null);
                    notify({ message, classes: 'notification-success' });
                    close(next);
                });
                networkActivityTracker.track(promise);
            };
            self.cancel = () => {
                const promise = User.lock()
                .then(() => close(false));
                networkActivityTracker.track(promise);
            };
            setTimeout(() => document.getElementById('newPassword').focus(), 0);
        }
    });
});

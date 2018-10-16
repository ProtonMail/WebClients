/* @ngInject */
function changePasswordModal(
    changeMailboxPassword,
    eventManager,
    gettextCatalog,
    networkActivityTracker,
    notification,
    pmModal,
    settingsApi,
    userSettingsModel,
    User
) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/modals/changePassword.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            const self = this;
            const { type = '', phase = 0 } = params;
            const promises = {
                password: () => changeMailboxPassword({ newPassword: self.newPassword, onePassword: true }),
                login: () => settingsApi.password(self.newPassword),
                mailbox: () => changeMailboxPassword({ newPassword: self.newPassword, onePassword: false })
            };
            self.mode = userSettingsModel.get('PasswordMode');
            self.type = type;
            self.newPassword = '';
            self.confirmPassword = '';
            self.submit = () => {
                const next = phase === 1;
                const promise = promises[type]()
                    .then(() => (next ? Promise.resolve() : User.lock()))
                    .then(() => eventManager.call())
                    .then(() => {
                        notification.success(gettextCatalog.getString('Password updated', null, 'Success'));
                        params.close(next);
                    });
                networkActivityTracker.track(promise);
            };
            self.cancel = () => {
                const promise = User.lock().then(() => params.close(false));
                networkActivityTracker.track(promise);
            };
            setTimeout(() => document.getElementById('newPassword').focus(), 0);
        }
    });
}
export default changePasswordModal;

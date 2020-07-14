import { CLIENT_TYPE, ACCOUNT_DELETION_REASONS } from '../../constants';

/* @ngInject */
function deleteAccountModal(
    pmModal,
    Report,
    User,
    networkActivityTracker,
    authentication,
    $state,
    gettextCatalog,
    userSettingsModel,
    userType,
    translator
) {
    const I18N = translator(() => ({
        selectReason: gettextCatalog.getString('Select a reason', null, 'Reason to delete account'),
        differentAccount: gettextCatalog.getString(
            'I use a different Proton account',
            null,
            'Reason to delete account'
        ),
        tooExpensive: gettextCatalog.getString("It's too expensive", null, 'Reason to delete account'),
        missingKeyFeature: gettextCatalog.getString(
            "It's missing a key feature that I need",
            null,
            'Reason to delete account'
        ),
        foundAnotherService: gettextCatalog.getString(
            'I found another service that I like better',
            null,
            'Reason to delete account'
        ),
        notListed: gettextCatalog.getString("My reason isn't listed", null, 'Reason to delete account')
    }));

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
        controller: function(params) {
            this.hasTwoFactor = userSettingsModel.get('TwoFactor');
            this.isAdmin = userType().isAdmin;
            this.cancel = params.close;
            this.check = false;
            this.email = '';
            this.feedback = '';
            this.password = '';
            this.twoFactorCode = '';
            this.reasons = [
                {
                    label: I18N.selectReason,
                    value: '',
                    disabled: true
                },
                {
                    label: I18N.differentAccount,
                    value: ACCOUNT_DELETION_REASONS.DIFFERENT_ACCOUNT
                },
                this.isAdmin && { label: I18N.tooExpensive, value: ACCOUNT_DELETION_REASONS.TOO_EXPENSIVE },
                {
                    label: I18N.missingKeyFeature,
                    value: ACCOUNT_DELETION_REASONS.MISSING_FEATURE
                },
                {
                    label: I18N.foundAnotherService,
                    value: ACCOUNT_DELETION_REASONS.USE_OTHER_SERVICE
                },
                {
                    label: I18N.notListed,
                    value: ACCOUNT_DELETION_REASONS.OTHER
                }
            ].filter(Boolean);
            this.reason = this.reasons[0];

            this.isSubmitDisabled = () => {
                if (!this.check || !this.reason.value || !this.password) {
                    return true;
                }
                if (this.hasTwoFactor && !this.twoFactorCode) {
                    return true;
                }
                return false;
            };

            this.submit = () => {
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
                    Email: this.email || 'noemail@example.com',
                    Description: this.feedback
                };

                const promise = deleteUser({
                    Password: this.password,
                    TwoFactorCode: this.twoFactorCode,
                    Reason: this.reason.value,
                    Email: this.email,
                    Feedback: this.feedback
                })
                    .then(() => report(params, this.isAdmin))
                    .then(() => $state.go('login'));

                networkActivityTracker.track(promise);
            };
        }
    });
}
export default deleteAccountModal;

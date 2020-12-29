import { CLIENT_TYPE, ACCOUNT_DELETION_REASONS } from '../../constants';
import { wait } from '../../../helpers/promiseHelper';

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
    translator,
    eventManager,
    notification
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

    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/modals/deleteAccount.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            this.hasTwoFactor = userSettingsModel.get('TwoFactor');
            this.isAdmin = userType().isAdmin;
            this.isFree = userType().isFree;
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
                {
                    label: I18N.tooExpensive,
                    value: ACCOUNT_DELETION_REASONS.TOO_EXPENSIVE
                },
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

                const handleDeleteUser = async () => {
                    try {
                        eventManager.stop();

                        // First ensure the password and totp is correct
                        await User.password({ Password: this.password, TwoFactorCode: this.twoFactorCode });

                        await User.canDelete();

                        if (this.isAdmin) {
                            await Report.bug(params);
                        }

                        await User.delete({
                            Reason: this.reason.value,
                            Email: this.email,
                            Feedback: this.feedback
                        });

                        notification.success(gettextCatalog.getString('Account deleted. Logging out...', null, 'Info'));

                        // Add an artificial delay to show the notification.
                        await wait(2500);

                        authentication.logout(false, false);

                        $state.go('login');
                    } catch (e) {
                        eventManager.start();
                        throw e;
                    }
                };

                networkActivityTracker.track(handleDeleteUser());
            };
        }
    });
}
export default deleteAccountModal;

import _ from 'lodash';

/* @ngInject */
function memberSubLogin(
    $state,
    organizationKeysModel,
    notification,
    loginPasswordModal,
    memberModel,
    authentication,
    networkActivityTracker,
    translator,
    gettextCatalog
) {
    const I18N = translator(() => ({
        ERROR: gettextCatalog.getString(
            'Permission denied, administrator privileges have been restricted.',
            null,
            'Error'
        )
    }));

    const SUBLOGIN_URL = $state.href('login.sub', { sub: true }, { absolute: true });

    function canLogin() {
        if (organizationKeysModel.get('keyStatus') > 0) {
            notification.error(I18N.ERROR);
            $state.go('secured.members');
            return false;
        }
        return true;
    }

    const sendMessage = (domain, onReady = angular.noop) => {
        const receive = (event) => {
            if (event.origin !== domain) {
                onReady(false);
            }
            if (event.data === 'ready') {
                onReady(true);
                window.removeEventListener('message', receive);
            }
        };

        window.addEventListener('message', receive, false);
    };

    const submitAction = (member) => (Password, TwoFactorCode) => {
        loginPasswordModal.deactivate();

        const [host, , base] = window.location.href.split('/');
        const config = { domain: `${host}//${base}` };

        sendMessage(config.domain, (isReady) => (config.isReady = isReady));

        // Open new tab
        const child = window.open(SUBLOGIN_URL, '_blank');

        const promise = memberModel
            .login(member, { Password, TwoFactorCode })
            .then((UID) => {
                const mailboxPassword = authentication.getPassword();
                const cb = () => {
                    if (config.isReady) {
                        // Send the session token and the organization owner’s  mailbox password to the target URI
                        child.postMessage({ UID, mailboxPassword }, config.domain);
                    } else {
                        _.delay(cb, 500);
                    }
                };
                cb();
            })
            .catch((error) => {
                child.close();
                throw error;
            });
        networkActivityTracker.track(promise);
    };

    /**
     * Allow the current user to access to the mailbox of a specific member
     * @param {Object} member
     */
    const login = (member) => {
        if (canLogin()) {
            loginPasswordModal.activate({
                params: {
                    submit: submitAction(member),
                    cancel() {
                        loginPasswordModal.deactivate();
                    }
                }
            });
        }
    };

    return { login, canLogin };
}
export default memberSubLogin;

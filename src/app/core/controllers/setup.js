import { WIZARD_ENABLED, UNPAID_STATE } from '../../constants';

/* @ngInject */
function SetupController(
    $rootScope,
    $scope,
    $state,
    Address,
    authentication,
    domains,
    networkActivityTracker,
    setupKeys,
    user,
    addresses
) {
    let passwordCopy;

    $scope.filling = true;
    $scope.creating = false;
    $scope.genKeys = false;
    $scope.setupAccount = false;
    $scope.getUserInfo = false;
    $scope.finishCreation = false;
    $scope.generating = false;
    $scope.vpnEnabled = (user.VPN || {}).Status;

    // Populate the domains <select>
    $scope.domains = domains.map((value) => ({ label: value, value }));
    $scope.domain = $scope.domains[0];

    // Username
    $scope.username = user.Name;
    // Address creation needed?
    $scope.chooseDomain = !addresses.length;

    // Passwords
    $scope.model = {
        password: '',
        passwordConfirm: ''
    };

    $scope.submit = () => {
        $scope.setupError = false;
        // Save password in separate variable to prevent extensions/etc
        // from modifying it during setup process
        passwordCopy = $scope.model.password;
        const promise = tryToLogin()
            .then(setupAddress)
            .then(generateKeys)
            .then(installKeys)
            .then(doGetUserInfo)
            .then(finishRedirect);

        networkActivityTracker.track(promise).catch(() => {
            $scope.setupError = true;
        });
    };

    /**
     * Try to login for ProtonVPN user to detect if the password entered is correct
     * @return {Promise}
     */
    function tryToLogin() {
        if (!$scope.vpnEnabled) {
            return Promise.resolve();
        }

        /**
         * If there exists addresses, use the first one. This is make sure we are testing
         * the correct credentials for a sub-user with a custom domain with VPN.
         * If no addresses exist, assume it doesn't have a custom domain.
         */
        const Username = addresses.length ? addresses[0].Email : user.Name;

        return authentication.loginWithCredentials({
            Username,
            Password: passwordCopy
        });
    }

    async function setupAddress() {
        $scope.filling = false;

        if (!addresses.length) {
            return Address.setup({ Domain: $scope.domain.value }).then(({ data = {} } = {}) => {
                return [data.Address];
            });
        }
        return addresses;
    }

    function generateKeys(addresses) {
        $scope.genKeys = true;
        return setupKeys.generate(addresses, passwordCopy);
    }

    function installKeys(data = {}) {
        $scope.$applyAsync(() => {
            $scope.genKeys = false;
            $scope.creating = true;
            $scope.setupAccount = true;
        });

        return setupKeys.setup(data, passwordCopy).then(() => {
            $scope.$applyAsync(() => {
                authentication.savePassword(data.mailboxPassword);
                $rootScope.isLoggedIn = authentication.isLoggedIn();
                $rootScope.isLocked = authentication.isLocked();
                $rootScope.isSecure = authentication.isSecured();
            });
        });
    }

    function doGetUserInfo() {
        $scope.getUserInfo = true;
        return authentication.fetchUserInfo();
    }

    function finishRedirect() {
        $scope.finishCreation = true;

        if (authentication.user.Delinquent < UNPAID_STATE.DELINQUENT) {
            return $state.go('secured.inbox', { welcome: WIZARD_ENABLED });
        }
        $state.go('secured.dashboard');
    }
}
export default SetupController;

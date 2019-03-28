import { decryptMessage, getMessage } from 'pmcrypto';

/* @ngInject */
function OutsideUnlockController(
    $scope,
    $state,
    $stateParams,
    encryptedToken,
    networkActivityTracker,
    notification,
    eoStore
) {
    $scope.params = {
        MessagePassword: ''
    };

    $scope.tokenError = !encryptedToken;

    /**
     * Decrypt message, set tokens and redirect
     * @param {String} password
     * @return {Promise}
     */
    const decryptAndRedirect = async (password = '') => {
        const message = await getMessage(encryptedToken);
        const { data } = await decryptMessage({ message, passwords: [password] });

        eoStore.setToken(data);
        eoStore.setPassword(password);

        return $state.go('eo.message', { tag: $stateParams.tag });
    };

    $scope.unlock = async () => {
        try {
            const promise = decryptAndRedirect($scope.params.MessagePassword);
            await networkActivityTracker.track(promise, true);
        } catch (e) {
            notification.error('Wrong Mailbox Password.');
        }
    };
}

export default OutsideUnlockController;

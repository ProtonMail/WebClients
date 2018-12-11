import { decryptMessage, encodeUtf8Base64, getMessage } from 'pmcrypto';

/* @ngInject */
function OutsideUnlockController(
    $scope,
    $state,
    $stateParams,
    encryptedToken,
    networkActivityTracker,
    notification,
    secureSessionStorage
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

        secureSessionStorage.setItem('proton:decrypted_token', data);
        secureSessionStorage.setItem('proton:encrypted_password', encodeUtf8Base64(password));

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

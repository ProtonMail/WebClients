/* @ngInject */
function checkKeysFormat($injector, CONSTANTS) {
    return (user) => {
        for (let i = 0; i < user.Keys.length; i++) {
            const key = user.Keys[i];

            if (key.Version < CONSTANTS.KEY_VERSION && key.decrypted) {
                return false;
            }
        }

        const addresses = $injector.get('addressesModel').getByUser(user);

        for (let i = 0; i < addresses.length; i++) {
            const addressKeys = addresses[i].Keys;

            for (let j = 0; j < addressKeys.length; j++) {
                const key = addressKeys[j];

                if (key.Version < CONSTANTS.KEY_VERSION && key.decrypted) {
                    return false;
                }
            }
        }

        return true;
    };
}
export default checkKeysFormat;

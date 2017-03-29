angular.module('proton.keys')
    .factory('checkKeysFormat', (
        CONSTANTS
    ) => {

        return (user) => {
            for (let i = 0; i < user.Keys.length; i++) {
                const key = user.Keys[i];
                if (key.Version < CONSTANTS.KEY_VERSION && key.decrypted) {
                    return false;
                }
            }

            for (let i = 0; i < user.Addresses.length; i++) {
                const addressKeys = user.Addresses[i].Keys;
                for (let j = 0; j < addressKeys.length; j++) {
                    const key = addressKeys[j];
                    if (key.Version < CONSTANTS.KEY_VERSION && key.decrypted) {
                        return false;
                    }
                }
            }
            return true;
        };
    });

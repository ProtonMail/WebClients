import { KEY_VERSION, MAIN_KEY } from '../../constants';

/* @ngInject */
function checkKeysFormat($injector, keysModel) {
    return (user) => {
        const userKeys = keysModel.getAllKeys(MAIN_KEY);

        for (let i = 0; i < userKeys.length; i++) {
            const { key, pkg } = userKeys[i];

            if (key.Version < KEY_VERSION && pkg) {
                return false;
            }
        }

        const addresses = $injector.get('addressesModel').getByUser(user);

        for (let i = 0; i < addresses.length; i++) {
            const addressKeys = keysModel.getAllKeys(addresses[i].ID);

            for (let j = 0; j < addressKeys.length; j++) {
                const { key, pkg } = addressKeys[j];

                if (key.Version < KEY_VERSION && pkg) {
                    return false;
                }
            }
        }

        return true;
    };
}
export default checkKeysFormat;

/* @ngInject */
function addressWithoutKeysManager(addressWithoutKeys, authentication, generateModal, $injector) {
    /**
     * Open the generate Key modal for a list of addresses
     * @param  {Array} options.addresses List of addresses
     * @param  {String} options.password  Login password
     * @param  {Object} options.memberMap <address.ID:String> => <member:Object>
     * @return {Promise}
     */
    const openModal = async ({ addresses, password, memberMap = {} }) => {
        if (addresses.length && !generateModal.active()) {
            // Prevent circular injection
            const organizationModel = $injector.get('organizationModel');
            const organizationKeysModel = $injector.get('organizationKeysModel');
            await organizationKeysModel.manage(organizationModel.get());
            return new Promise((resolve, reject) => {
                generateModal.activate({
                    params: {
                        memberMap,
                        password,
                        addresses,
                        organizationKey: organizationKeysModel.get('organizationKey'),
                        onSuccess() {
                            $injector.get('eventManager').call();
                            resolve(addresses);
                            generateModal.deactivate();
                        },
                        close() {
                            reject(new Error('generateModal:close'));
                            generateModal.deactivate();
                        }
                    }
                });
            });
        }
    };

    /**
     * Open the generate modal if we find addresses without a key
     * @param  {Array} memberList
     * @param  {String} password
     * @return {Promise}
     */
    const manage = (user = authentication.user, memberList = [], isEvent) => {
        const { addresses, memberMap } = addressWithoutKeys.get(user, memberList, isEvent);
        const password = authentication.getPassword();
        return openModal({ addresses, memberMap, password });
    };

    /**
     * Generate a key for an address ex: after click on generate button
     * @param  {Array} addresses List of addresses
     * @param  {Object} memberMap
     * @param  {String} password
     * @return {Promise}
     */
    const manageOne = (address, member = {}, password = authentication.getPassword()) => {
        const addresses = [address];
        const memberMap = { [address.ID]: member };

        // For the current user when we try to generate the key
        if (member.Private) {
            return openModal({ addresses, password });
        }

        return openModal({ addresses, memberMap, password });
    };

    return { manage, manageOne };
}
export default addressWithoutKeysManager;

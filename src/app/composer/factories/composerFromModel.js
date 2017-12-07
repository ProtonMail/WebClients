/* @ngInject */
function composerFromModel(authentication, plusAliasModel) {
    /**
     * Return list of addresses available in the FROM select
     * @param  {Object} message
     * @return {Array}
     */
    function getAddresses({ xOriginalTo, AddressID }) {
        const plusAddress = plusAliasModel.getAddress(xOriginalTo);
        const addresses = _.chain(authentication.user.Addresses)
            .where({ Status: 1, Receive: 1 })
            .sortBy('Order')
            .value();

        if (plusAddress) {
            addresses.unshift(plusAddress);
        }

        if (!plusAddress && AddressID) {
            const address = _.find(addresses, { ID: AddressID });
            return [address, ...addresses.filter(({ ID }) => ID !== AddressID)];
        }

        return addresses;
    }

    return { getAddresses };
}
export default composerFromModel;

/* @ngInject */
function composerFromModel(authentication, plusAliasModel) {
    /**
     * Return list of addresses available in the FROM select
     * @param  {Object} message
     * @return {Object}
     */
    function get({ xOriginalTo, AddressID }) {
        const plusAddress = plusAliasModel.getAddress(xOriginalTo);
        const addresses = _.chain(authentication.user.Addresses)
            .where({ Status: 1, Receive: 1 })
            .sortBy('Order')
            .value();

        if (plusAddress) {
            // It's important to unshift the plus address to be found first with find()
            addresses.unshift(plusAddress);
        }

        return { addresses, address: find(addresses, AddressID) };
    }

    /**
     * Return the address selected in the FROM select
     * @param  {Array} addresses
     * @param  {String} ID AddressID
     * @return {Object}
     */
    function find(addresses = [], ID) {
        if (!authentication.hasPaidMail()) {
            const onlySend = _.where(addresses, { Send: 1 });
            return _.findWhere(onlySend, { ID }) || onlySend[0];
        }

        if (ID) {
            return _.findWhere(addresses, { ID });
        }

        return addresses[0];
    }

    return { get };
}
export default composerFromModel;

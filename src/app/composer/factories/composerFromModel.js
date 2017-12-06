angular.module('proton.composer')
    .factory('composerFromModel', (authentication, plusAliasModel) => {
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
                const fromIndex = _.findIndex(addresses, { ID: AddressID });
                const toIndex = 0;

                return addresses.splice(toIndex, 0, addresses.splice(fromIndex, 1)[0]);
            }

            return addresses;
        }

        return { getAddresses };
    });

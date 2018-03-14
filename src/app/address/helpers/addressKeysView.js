import _ from 'lodash';

/**
 * From a group of addresses, massage the data in the way that the address keys view directive expects
 * with it's keys and main key as the first key.
 * @param {Object} addresses
 * @return {Array}
 */
export const getAddressKeys = (addresses = {}) => {
    return addresses.reduce((acc, { Keys = [], ID = '', Email = '', Order }) => {
        if (!Keys.length) {
            return acc;
        }
        const { fingerprint, created, bitSize, PublicKey } = Keys[0];
        const address = {
            order: Order,
            addressID: ID,
            email: Email,
            fingerprint,
            created,
            bitSize,
            publicKey: PublicKey,
            keys: Keys
        };
        acc.push(address);
        return acc;
    }, []);
};

/**
 * From a user, get the contact keys, group them by display name, and get them in the address keys format.
 * @param {User} user
 * @returns {Array}
 */
export const getUserKeys = (user, addresses) => {
    const getAddressFromFingerprint = (addresses, wantedFingerprint) => _.find(addresses, ({ Keys = [] }) =>
        _.find(Keys, ({ fingerprint }) => fingerprint === wantedFingerprint));

    const groupedByDisplayName = user.Keys.reduce((acc, key) => {
        const address = getAddressFromFingerprint(addresses, key.fingerprint);

        // Should never happen, but just to be safe.
        if (!address) {
            return acc;
        }

        const { ID, DisplayName, Order } = address;

        if (!acc[DisplayName]) {
            acc[DisplayName] = {
                ID,
                Email: DisplayName,
                Order,
                Keys: []
            };
        }

        acc[DisplayName].Keys.push(key);

        return acc;
    }, {});
    const mapped = Object.keys(groupedByDisplayName).map((key) => groupedByDisplayName[key]);
    return getAddressKeys(mapped);
};

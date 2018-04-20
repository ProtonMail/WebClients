import _ from 'lodash';
import { ADDRESS_TYPE } from '../../constants';
import updateCollection from '../../utils/helpers/updateCollection';

const { PREMIUM } = ADDRESS_TYPE;

/* @ngInject */
function addressesModel(Address, authentication, dispatchers, keyInfo) {
    const { dispatcher, on } = dispatchers(['addressesModel']);
    let CACHE = {};
    const sortByOrder = (addresses = []) => _.sortBy(addresses, 'Order');
    /**
     * Prepare addresses to add information in each keys
     * @param  {Array} addresses
     * @return {Promise} addreses
     */
    const formatKeys = (addresses = []) => {
        const promises = addresses.reduce((acc, address) => {
            const { Keys = [] } = address;
            const pKeys = Promise.all(Keys.map(keyInfo));

            return acc.concat(pKeys.then((keys) => ({ ...address, Keys: keys })));
        }, []);

        return Promise.all(promises);
    };

    /**
     * Save and formatted addresses in the cache
     * @param {Array}   addresses
     * @param {[type]}  user
     * @param {Boolean} noEvent
     * @return {Promise}
     */
    const set = (addresses = [], user = authentication.user, noEvent = false) => {
        const sortedAddresses = sortByOrder(addresses);

        return formatKeys(sortedAddresses).then((formattedAddresses) => {
            CACHE[user.ID] = formattedAddresses;
            !noEvent && dispatcher.addressesModel('addresses.updated', { addresses: formattedAddresses });
        });
    };

    /**
     * Fetch addresses from current user
     * @return {Promise}
     */
    const fetch = (user = authentication.user) => {
        return Address.query().then(({ Addresses = [] }) => {
            const copy = Addresses.slice();

            set(copy, user);

            return copy;
        });
    };

    /**
     * Get address collection from cache
     * @param  {Object} user
     * @return {Array}
     */
    const getByUser = (user = authentication.user) => {
        if (!CACHE[user.ID]) {
            return [];
        }

        return CACHE[user.ID];
    };

    /**
     * Get first address from cache
     * @param  {Object} user
     * @return {Object}
     */
    const getFirst = (user = authentication.user) => {
        const [first] = getByUser(user);

        return first || {};
    };

    /**
     * Get specific address from cache
     * @param  {String} ID
     * @param  {Object} user
     * @param  {Boolean} force
     * @return {Object}
     */
    const getByID = (ID, user = authentication.user, force = false) => {
        if (!CACHE[user.ID]) {
            return {};
        }

        const address = _.find(CACHE[user.ID], { ID });

        if (address) {
            return address;
        }

        if (force) {
            return;
        }

        return getFirst(user);
    };

    const get = () => getByUser();
    const clear = () => (CACHE = {});
    const hasPmMe = () => _.find(CACHE[authentication.user.ID], { Type: PREMIUM });

    on('app.event', (e, { type, data }) => {
        if (type === 'addresses.event') {
            const { collection } = updateCollection(CACHE[authentication.user.ID], data.addresses, 'Address');

            set(collection);
        }
    });

    on('logout', () => clear());

    return {
        fetch,
        get,
        getFirst,
        getByUser,
        getByID,
        set,
        hasPmMe
    };
}

export default addressesModel;

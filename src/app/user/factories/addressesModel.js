import _ from 'lodash';
import { CONSTANTS } from '../../constants';
import updateCollection from '../../utils/helpers/updateCollection';

/* @ngInject */
function addressesModel(Address, authentication, dispatchers) {
    const { ADDRESS_TYPE } = CONSTANTS;
    const { PREMIUM } = ADDRESS_TYPE;
    const { dispatcher, on } = dispatchers(['addressesModel']);
    let CACHE = {};

    const set = (addresses = [], user = authentication.user, noEvent = false) => {
        CACHE[user.ID] = addresses;
        !noEvent && dispatcher.addressesModel('addresses.updated', { addresses });
    };

    /**
     * Fetch addresses from current user
     * @return {Promise}
     */
    const fetch = (user = authentication.user) => {
        return Address.query()
            .then(({ Addresses = [] }) => {
                const copy = Addresses.slice(0);

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
    const clear = () => CACHE = {};
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

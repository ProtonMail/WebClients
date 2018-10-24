import _ from 'lodash';
import updateCollection from '../../utils/helpers/updateCollection';

/* @ngInject */
function domainModel(dispatchers, domainApi) {
    const CACHE = { domains: [] };
    const { dispatcher, on } = dispatchers(['domainsChange']);
    const query = () => CACHE.domains.slice();
    const get = (ID) => _.find(query(), { ID });

    const set = (newDomains = []) => {
        CACHE.domains = newDomains.slice();
        dispatcher.domainsChange('', query());
    };

    const catchall = async (ID, AddressID) => {
        const data = (await domainApi.catchall(ID, { AddressID })) || {};
        const domain = _.find(CACHE.domains, { ID });

        domain.CatchAll = AddressID;

        return data;
    };

    const fetchAddresses = async (domain = {}) => {
        const { Addresses = [] } = (await domainApi.addresses(domain.ID)) || {};

        domain.Addresses = Addresses;

        return domain;
    };

    const fetch = async () => {
        const { Domains = [] } = (await domainApi.query()) || {};

        set(await Promise.all(Domains.map(fetchAddresses)));

        return query();
    };

    const clear = () => (CACHE.domains.length = 0);

    const manageCache = async (events) => {
        const { collection = [] } = updateCollection(CACHE.domains, events, 'Domain');
        set(await Promise.all(collection.map(fetchAddresses)));
    };

    on('app.event', (e, { type, data = {} }) => {
        type === 'domains' && manageCache(data);
    });

    on('logout', () => {
        clear();
    });

    return { query, get, set, fetch, clear, catchall };
}
export default domainModel;

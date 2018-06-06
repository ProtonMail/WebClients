import _ from 'lodash';

/* @ngInject */
function domainModel(dispatchers, domainApi, gettextCatalog) {
    let domains = [];
    const { dispatcher, on } = dispatchers(['domainsChange']);
    const errorMessage = gettextCatalog.getString('Domain request failed', null, 'Error');
    const query = () => angular.copy(domains);
    const get = (ID) => _.find(query(), { ID });

    function set(newDomains) {
        domains = newDomains;
    }
    function catchall(ID, AddressID) {
        return domainApi
            .catchall(ID, { AddressID })
            .then(({ data = {} } = {}) => {
                const domain = _.find(domains, { ID });

                domain.CatchAll = AddressID;
                return data;
            })
            .catch(({ data = {} } = {}) => {
                throw new Error(data.Error || errorMessage);
            });
    }

    async function fetchAddresses(domain = {}) {
        try {
            const { data = {} } = await domainApi.addresses(domain.ID);
            const { Addresses = [] } = data;

            domain.Addresses = Addresses;

            return domain;
        } catch (err) {
            const { data = {} } = err || {};

            throw new Error(data.Error || errorMessage);
        }
    }

    async function fetch() {
        try {
            const { data = {} } = await domainApi.query();
            const { Domains = [] } = data;

            set(await Promise.all(Domains.map(fetchAddresses)));

            return query();
        } catch (err) {
            const { data = {} } = err || {};

            throw new Error(data.Error || errorMessage);
        }
    }

    const clear = () => (domains.length = 0);

    on('deleteDomain', (event, ID) => {
        const index = _.findIndex(domains, { ID });

        if (index > -1) {
            domains.splice(index, 1);
            dispatcher.domainsChange('', domains);
        }
    });

    on('createDomain', (event, ID, domain) => {
        const index = _.findIndex(domains, { ID });

        if (index === -1) {
            domains.push(domain);
        } else {
            _.extend(domains[index], domain);
        }
        dispatcher.domainsChange('', domains);
    });

    on('updateDomain', (event, ID, domain) => {
        const index = _.findIndex(domains, { ID });

        if (index === -1) {
            domains.push(domain);
        } else {
            _.extend(domains[index], domain);
        }
        dispatcher.domainsChange('', domains);
    });

    on('logout', () => {
        clear();
    });

    return { query, get, set, fetch, clear, catchall };
}
export default domainModel;

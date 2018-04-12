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
                const domain = _.find(domains, { ID }) || {};
                domain.CatchAll = AddressID;
                return data;
            })
            .catch(({ data = {} } = {}) => {
                throw new Error(data.Error || errorMessage);
            });
    }
    function fetch() {
        return domainApi.query()
            .then(({ data = {} } = {}) => {
                domains = data.Domains;
                return data.Domains;
            })
            .catch(({ data = {} } = {}) => {
                throw new Error(data.Error || errorMessage);
            });
    }
    function clear() {
        domains.length = 0;
    }

    on('deleteDomain', (event, ID) => {
        const index = _.findIndex(domains, { ID });

        if (index > -1) {
            domains.splice(index, 1);
            dispatcher.domainsChange('', domains);
        }
    });

    const update = (e, ID, domain) => {
        const index = _.findIndex(domains, { ID });
        if (index === -1) {
            domains.push(domain);
        } else {
            _.extend(domains[index], domain);
        }
        dispatcher.domainsChange('', domains);
    };

    on('createDomain', update);
    on('updateDomain', update);

    on('logout', () => {
        clear();
    });

    return { query, get, set, fetch, clear, catchall };
}
export default domainModel;

import _ from 'lodash';

/* @ngInject */
function domainModel($rootScope, domainApi, gettextCatalog) {
    let domains = [];
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
    function fetch() {
        return domainApi
            .query()
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
    $rootScope.$on('deleteDomain', (event, ID) => {
        const index = _.findIndex(domains, { ID });

        if (index > -1) {
            domains.splice(index, 1);
            $rootScope.$emit('domainsChange', domains);
        }
    });
    $rootScope.$on('createDomain', (event, ID, member) => {
        const index = _.findIndex(domains, { ID });

        if (index === -1) {
            domains.push(member);
        } else {
            _.extend(domains[index], member);
        }
        $rootScope.$emit('domainsChange', domains);
    });
    $rootScope.$on('updateDomain', (event, ID, member) => {
        const index = _.findIndex(domains, { ID });

        if (index === -1) {
            domains.push(member);
        } else {
            _.extend(domains[index], member);
        }
        $rootScope.$emit('domainsChange', domains);
    });
    $rootScope.$on('logout', () => {
        clear();
    });
    return { query, get, set, fetch, clear, catchall };
}
export default domainModel;

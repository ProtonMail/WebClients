angular.module('proton.domains')
    .factory('domainModel', ($rootScope, domainApi, gettextCatalog) => {
        let domains = [];
        const errorMessage = gettextCatalog.getString('Domain request failed', null, 'Error');
        const query = () => angular.copy(domains);
        const get = (ID) => _.findWhere(query(), { ID });

        function set(newDomains) {
            domains = newDomains;
        }
        function catchall(ID, AddressID) {
            return domainApi.catchall(ID, { AddressID })
                .then(({ data = {} } = {}) => {
                    if (data.Code === 1000) {
                        const domain = _.findWhere(domains, { ID });

                        domain.CatchAll = AddressID;

                        return data;
                    }
                    throw new Error(data.Error || errorMessage);
                });
        }
        function fetch() {
            return domainApi.query()
                .then(({ data = {} } = {}) => {
                    if (data.Code === 1000) {
                        domains = data.Domains;
                        return data.Domains;
                    }
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
        return { query, get, set, fetch, clear, catchall };
    });

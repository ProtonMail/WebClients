angular.module('proton.domains')
.factory('pmDomainModel', (domainApi, gettextCatalog) => {
    const errorMessage = gettextCatalog.getString('Domain request failed', null, 'Error');
    const domains = [];
    function get() {
        return domains;
    }
    function fetch() {
        return domainApi.available()
        .then(({ data = {} } = {}) => {
            if (data.Code === 1000) {
                clear();
                domains.push(...data.Domains);
                return domains;
            }
            throw new Error(data.Error || errorMessage);
        });
    }
    function clear() {
        domains.length = 0;
    }
    return { get, fetch, clear };
});

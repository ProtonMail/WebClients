/* @ngInject */
function pmDomainModel($rootScope, authentication, domainApi, gettextCatalog) {
    const errorMessage = gettextCatalog.getString('Domain request failed', null, 'Error');
    const domains = [];
    const get = () => domains.slice();

    function set(list) {
        clear();
        domains.push(...list);
    }
    function fetch() {
        const promises = [domainApi.available()];

        if (authentication.isSecured() && authentication.hasPmMe()) {
            promises.push(domainApi.premium());
        }

        return Promise.all(promises).then((result) => {
            const list = result.reduce((acc, { data = {} } = {}) => {
                if (data.Code === 1000) {
                    acc.push(...data.Domains);
                    return acc;
                }
                throw new Error(data.Error || errorMessage);
            }, []);

            set(list);

            return list;
        });
    }
    function clear() {
        domains.length = 0;
    }
    $rootScope.$on('logout', () => {
        clear();
    });
    return { get, fetch, clear };
}
export default pmDomainModel;

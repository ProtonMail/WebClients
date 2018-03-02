/* @ngInject */
function pmDomainModel($rootScope, authentication, domainApi) {
    const domains = [];
    const get = () => domains.slice();

    function set(list) {
        clear();
        domains.push(...list);
    }
    function fetch() {
        const promises = [domainApi.available()];

        if (authentication.isSecured() && authentication.hasPaidMail()) {
            promises.push(domainApi.premium());
        }

        return Promise.all(promises).then((result) => {
            const list = result.reduce((acc, { data = {} } = {}) => {
                acc.push(...data.Domains);
                return acc;
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

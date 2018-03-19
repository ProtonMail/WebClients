/* @ngInject */
function pmDomainModel(authentication, dispatchers, domainApi) {
    const domains = [];
    const get = () => domains.slice();
    const { on } = dispatchers();

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

    on('logout', () => {
        clear();
    });

    return { get, fetch, clear };
}
export default pmDomainModel;

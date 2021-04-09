/* @ngInject */
function pmDomainModel(authentication, dispatchers, domainApi) {
    const domains = [];
    const get = () => domains.slice();
    const { on } = dispatchers();

    function set(list) {
        clear();
        domains.push(...list);
    }

    const allowPremium = () => authentication.isLoggedIn() && authentication.hasPaidMail();

    function fetch(params) {
        const promises = [domainApi.available(params)];

        if (allowPremium()) {
            promises.push(domainApi.premium());
        }

        return Promise.all(promises).then((result) => {
            const list = result.reduce((acc, data = {}) => {
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
        allowPremium() && clear();
    });

    return { get, fetch, clear };
}
export default pmDomainModel;

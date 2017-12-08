/* @ngInject */
function pmDomainModel(authentication, domainApi, gettextCatalog) {
    const errorMessage = gettextCatalog.getString('Domain request failed', null, 'Error');
    const domains = [];
    function get() {
        return domains;
    }
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
    return { get, fetch, clear };
}
export default pmDomainModel;

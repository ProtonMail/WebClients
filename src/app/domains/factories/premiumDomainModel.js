/* @ngInject */
function premiumDomainModel(authentication, domainApi) {
    const CACHE = {};
    const set = (premiums = []) => (CACHE.premiums = premiums);
    const get = () => CACHE.premiums.slice();
    const first = () => {
        const [domain = 'pm.me'] = get() || [];
        return domain;
    };
    const fetch = () => domainApi.premium().then(({ Domains = [] }) => (set(Domains), get()));
    const email = () => `${authentication.user.Name}@${first()}`;

    return { first, fetch, email };
}
export default premiumDomainModel;

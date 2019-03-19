/* @ngInject */
function linkWebsite(gettextCatalog, translator) {
    const getURL = (lang, link) => ['https://protonmail.com', lang, link].filter(Boolean).join('/');

    const I18N = translator(() => ({
        username: gettextCatalog.getString('Forgot username?', null, 'Action'),
        forFree: gettextCatalog.getString('Sign up for free', null, 'Action'),
        signup: gettextCatalog.getString('Create Account', null, 'Action'),
        no: gettextCatalog.getString('No', null, 'Action')
    }));

    return {
        replace: true,
        template: '<a></a>',
        link(scope, el, { key, link }) {
            const [lang] = gettextCatalog.getCurrentLanguage().split(/[-_]/);
            el[0].textContent = I18N[key || link];
            el[0].href = getURL(lang !== 'en' && lang, link);
        }
    };
}
export default linkWebsite;

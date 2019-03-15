/* @ngInject */
function signupLink(gettextCatalog, translator) {
    const getURL = (lang = '') => ['https://protonmail.com', lang, 'signup'].filter(Boolean).join('/');

    const I18N = translator(() => ({
        forFree: gettextCatalog.getString('Sign up for free', null, 'Action'),
        default: gettextCatalog.getString('Create Account', null, 'Action'),
        no: gettextCatalog.getString('No', null, 'Action')
    }));

    return {
        replace: true,
        template: '<a></a>',
        link(scope, el, { key = 'default' }) {
            const [lang] = gettextCatalog.getCurrentLanguage().split(/[-_]/);
            el[0].textContent = I18N[key];
            el[0].href = getURL(lang !== 'en' && lang);
        }
    };
}
export default signupLink;

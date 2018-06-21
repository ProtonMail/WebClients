/* @ngInject */
function signupLink(gettextCatalog) {
    const getURL = (lang = '') => ['https://protonmail.com', lang, 'signup'].filter(Boolean).join('/');

    const getI18n = () => ({
        forFree: gettextCatalog.getString('Sign up', null, 'Action'),
        default: gettextCatalog.getString('Create Account', null, 'Action'),
        no: gettextCatalog.getString('No', null, 'Action')
    });

    return {
        replace: true,
        template: '<a style="background-image: u\\r\\l(\'#hostURL2#\')"></a>',
        link(scope, el, { key = 'default' }) {
            const [lang] = gettextCatalog.getCurrentLanguage().split('_');
            el[0].textContent = getI18n()[key];
            el[0].href = getURL(lang !== 'en' && lang);
        }
    };
}
export default signupLink;

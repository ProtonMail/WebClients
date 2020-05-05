/* @ngInject */
function atomLoader(gettextCatalog, translator) {
    const I18N = translator(() => ({
        decrypting: gettextCatalog.getString('Decrypting', null, 'atom text loader')
    }));

    const getTranslatedText = (translationKey) => {
        return `${I18N[translationKey]}`;
    };

    return {
        replace: true,
        templateUrl: require('../../../templates/ui/atomLoader.tpl.html'),
        link(scope, el, { translationKey, loaderTheme }) {
            const $textLoader = el[0].querySelector('.atomLoader-text');

            loaderTheme && el[0].classList.add(loaderTheme);

            if (translationKey) {
                $textLoader.innerHTML = getTranslatedText(translationKey);
            }
        }
    };
}
export default atomLoader;

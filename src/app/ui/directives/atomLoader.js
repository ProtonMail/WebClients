/* @ngInject */
function atomLoader(dispatchers, gettextCatalog) {
    const translations = {
        decrypting: gettextCatalog.getString('Decrypting', null, 'atom text loader'),
        upgradingKeys: gettextCatalog.getString(
            'Enabling calendar (coming soon).<br />This may take a few minutes, please wait.',
            null,
            'atom text loader'
        )
    };

    const getTranslatedText = (translationKey) => {
        return `${translations[translationKey]}`;
    };

    return {
        replace: true,
        templateUrl: require('../../../templates/ui/atomLoader.tpl.html'),
        link(scope, el, { translationKey, loaderTheme }) {
            const { on, unsubscribe } = dispatchers();
            let currentContent;
            const $textLoader = el[0].querySelector('.atomLoader-text');

            loaderTheme && el[0].classList.add(loaderTheme);

            if (translationKey) {
                currentContent = translationKey;
                $textLoader.innerHTML = getTranslatedText(translationKey);
            }

            on('AppModel', (event, { type, data }) => {
                const key = type === 'upgradingKeys' && data.value ? 'upgradingKeys' : translationKey;

                if (translationKey && currentContent !== key) {
                    $textLoader.innerHTML = getTranslatedText(key);
                    currentContent = key;
                }
            });

            scope.$on('$destroy', unsubscribe);
        }
    };
}
export default atomLoader;

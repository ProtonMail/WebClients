angular.module('proton.ui')
.directive('atomLoader', ($rootScope, gettextCatalog) => {

    const translations = {
        decrypting: gettextCatalog.getString('Decrypting', null, 'atom text loader'),
        upgradingKeys: gettextCatalog.getString('Enabling IMAP (coming soon).<br />This may take a few minutes, please wait.', null, 'atom text loader')
    };

    const getTranslatedText = (translationKey) => {
        return `${translations[translationKey]}`;
    };

    return {
        replace: true,
        templateUrl: 'templates/ui/atomLoader.tpl.html',
        link(scope, el, { translationKey, loaderTheme }) {
            let currentContent;
            const $textLoader = el[0].querySelector('.atomLoader-text');

            loaderTheme && el[0].classList.add(loaderTheme);

            if (translationKey) {
                currentContent = translationKey;
                $textLoader.innerHTML = getTranslatedText(translationKey);
            }

            const unsubscribe = $rootScope.$on('AppModel', (event, { type, data }) => {
                const key = (type === 'upgradingKeys' && data.value) ? 'upgradingKeys' : translationKey;

                if (translationKey && currentContent !== key) {
                    $textLoader.innerHTML = getTranslatedText(key);
                    currentContent = key;
                }
            });

            scope.$on('$destroy', () => unsubscribe());
        }
    };
});

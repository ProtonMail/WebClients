angular.module('proton.ui')
.directive('atomLoader', (gettextCatalog) => {

    const translations = {
        decrypting: gettextCatalog.getString('Decrypting', null, 'atom text loader')
    };

    const getTranslatedText = (translationKey) => {
        return `${translations[translationKey]} ...`;
    };

    return {
        replace: true,
        templateUrl: 'templates/ui/atomLoader.tpl.html',
        link(scope, el, { translationKey }) {

            const $textLoader = el[0].querySelector('.atomLoader-text');
            $textLoader.textContent = getTranslatedText(translationKey);
        }
    };
});

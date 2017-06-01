angular.module('proton.commons')
.filter('i18nNumber', () => {
    const numberFactory = window.Intl ? new Intl.NumberFormat(document.documentElement.lang) : { format: _.identity };
    return (input) => numberFactory.format(input);
});

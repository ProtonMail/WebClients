angular.module('proton.commons')
.filter('i18nNumber', () => {

    const numberFactory = new Intl.NumberFormat(document.documentElement.lang);

    return (input) => numberFactory.format(input);
});

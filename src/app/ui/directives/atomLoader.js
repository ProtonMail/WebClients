angular.module('proton.ui')
.directive('atomLoader', (gettextCatalog) => {
    return {
        scope: { text: '@' },
        replace: true,
        templateUrl: 'templates/ui/atomLoader.tpl.html',
        link(scope) {
            scope.translated = gettextCatalog.getString(scope.text, null, 'atom text loader');
        }
    };
});

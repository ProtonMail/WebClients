angular.module('proton.formUtils')
.directive('danger', (gettextCatalog) => {
    const dangerWord = gettextCatalog.getString('DANGER');
    const placeholder = gettextCatalog.getString("Enter the word 'DANGER' here.");
    function isDanger(value) {
        return value === dangerWord;
    }
    return {
        require: 'ngModel',
        restrict: 'A',
        scope: {
            dangerWord: '='
        },
        link(scope, element, attributes, ngModel) {
            scope.dangerWord = dangerWord;
            element.attr('placeholder', placeholder);
            ngModel.$validators.danger = isDanger;

        }
    };
});

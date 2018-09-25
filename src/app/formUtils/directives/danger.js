/* @ngInject */
function danger(gettextCatalog) {
    const dangerWord = gettextCatalog.getString('DANGER', null, 'Make sure the DANGER string is translated');
    const placeholder = gettextCatalog.getString(
        "Enter the word 'DANGER' here.",
        null,
        'Make sure the DANGER string is translated'
    );
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
}
export default danger;

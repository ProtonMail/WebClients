/* @ngInject */
function danger(gettextCatalog, translator) {
    const I18N = translator(() => ({
        DANGER: gettextCatalog.getString('DANGER', null, 'Make sure the DANGER string is translated'),
        PLACEHOLDER: gettextCatalog.getString("Enter the word 'DANGER' here.", null, 'Make sure the DANGER string is translated')
    }));

    function isDanger(value) {
        return value === I18N.DANGER;
    }
    return {
        require: 'ngModel',
        restrict: 'A',
        scope: {
            dangerWord: '='
        },
        link(scope, element, attributes, ngModel) {
            scope.dangerWord = I18N.DANGER;
            element.attr('placeholder', I18N.PLACEHOLDER);
            ngModel.$validators.danger = isDanger;
        }
    };
}
export default danger;

/* @ngInject */
function validLabel() {
    /**
     * Forbid <> for a label
     * @param  {ngModel} ngModel
     * @return {Boolean}
     */
    const validator = (ngModel) => (input) => {
        ngModel.$error.validLabel = !/<|>/.test(input || '');
        return ngModel.$error.validLabel;
    };

    return {
        require: 'ngModel',
        restrict: 'A',
        link(scope, el, attr, ngModel) {
            ngModel.$validators.validLabel = validator(ngModel);
        }
    };
}
export default validLabel;

/* @ngInject */
function validLabel() {
    const CACHE = { index: 0 };

    /**
     * Forbid <> for a new input value
     * Allow <> for an edit, because your label may already contain one
     * As ngModel.$modelValue is not reliable we store it to detect the edit
     * @param  {ngModel} ngModel
     * @return {Boolean}
     */
    const validator = (ngModel) => (input) => {
        if (!CACHE.index) {
            CACHE.index++;
            CACHE.value = ngModel.$modelValue;
            ngModel.$error.validLabel = !!CACHE.value;
            return ngModel.$error.validLabel;
        }

        ngModel.$error.validLabel = !CACHE.value ? !/<|>/.test(input) : true;
        return ngModel.$error.validLabel;
    };

    return {
        require: 'ngModel',
        restrict: 'A',
        link(scope, el, attr, ngModel) {
            ngModel.$validators.validLabel = validator(ngModel);
            scope.$on('$destroy', () => {
                delete CACHE.value;
                CACHE.index = 0;
            });
        }
    };
}
export default validLabel;

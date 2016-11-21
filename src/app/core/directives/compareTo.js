angular.module('proton.core')
.directive('compareTo', () => {
    return {
        require: 'ngModel',
        scope: {
            otherModelValue: '=compareTo'
        },
        link(scope, element, attributes, ngModel) {
            ngModel.$validators.compareTo = (modelValue) => {
                if (scope.otherModelValue) {
                    return modelValue === scope.otherModelValue;
                }
                return true;
            };

            scope.$watch('otherModelValue', () => {
                ngModel.$validate();
            });
        }
    };
});

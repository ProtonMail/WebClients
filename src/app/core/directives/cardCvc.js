angular.module('proton.core')
.directive('cardCvc', () => {
    return {
        require: 'ngModel',
        link(scope, element, attributes, ngModel) {
            ngModel.$validators.cardCvc = (modelValue) => {
                return $.payment.validateCardCVC(modelValue);
            };
        }
    };
});

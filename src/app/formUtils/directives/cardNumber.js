angular.module('proton.formUtils')
.directive('cardNumber', () => {
    return {
        require: 'ngModel',
        link(scope, element, attributes, ngModel) {
            ngModel.$validators.cardNumber = (modelValue) => {
                return $.payment.validateCardNumber(modelValue);
            };
        }
    };
});

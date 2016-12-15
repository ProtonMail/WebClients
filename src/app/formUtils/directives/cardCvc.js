angular.module('proton.formUtils')
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

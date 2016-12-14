angular.module('proton.ui')
.directive('danger', () => {
    function isDanger(value) {
        return value === 'DANGER';
    }
    return {
        require: 'ngModel',
        restrict: 'A',
        link(scope, element, attributes, ngModel) {
            ngModel.$validators.danger = isDanger;
        }
    };
});

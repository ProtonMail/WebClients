angular.module('proton.fieldMatch', [])
.directive('match', function () {
  return {
    require: 'ngModel',
    restrict: 'A',
    scope: { match: '=' },
    link: function(scope, elem, attrs, ctrl) {
      scope.$watch(function() {
        var modelValue = ctrl.$modelValue || ctrl.$$invalidModelValue;
        return (ctrl.$pristine && angular.isUndefined(modelValue)) || scope.match === modelValue;
      }, function(currentValue) {
        ctrl.$setValidity('match', currentValue);
      });
    }
  };
});

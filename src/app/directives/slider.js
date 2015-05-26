angular.module("proton.slider", [])
.directive("slider", function () {
  return {
    restrict: "E",
    replace : true,
    transclude : true,
    scope: {
      minValue: "=",
      maxValue: "=",
      steps: "=",
      value: "="
    },
    templateUrl: "templates/directives/slider.tpl.html",
    link: function ($scope, $element) {
      try {
      var dragdealer = new Dragdealer($($element[0]).find('.wrapper')[0], {
        snap: true,
        steps: $scope.steps,
        x: (($scope.value || 0) - $scope.minValue) / ($scope.maxValue - $scope.minValue),
        right: 4,
        left: 2,
        animationCallback: function (x) {
          $scope.$apply(function () {
            $scope.value = x * ($scope.maxValue - $scope.minValue) + $scope.minValue;
          });
        }
      });
      } catch(err) {
        console.error(err);
      }
    }
  };
});

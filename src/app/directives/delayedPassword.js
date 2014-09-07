angular.module("proton.delayedPassword", [])
.directive("delayedPassword", function ($timeout) {
  return {
    restrict: "A",
    link: function ($scope, $element) {
      console.log($element);
      $timeout(function () {
        $element[0].type = 'password';
      }, 50);
    }
  }
})

angular.module("proton.errorReporter", [])
.factory("errorReporter", function ($log, $rootScope) {
  var api = {
    catcher: function (msg, promise) {
      return function (error) {
        $log.error(error.error_description);
        if (msg) {
          $rootScope.errorReporter.active = true;
          $rootScope.errorReporter.error = msg;
        }
        if (promise) {
          promise.reject();
        }
      };
    }
  };
  return api;
})

.directive("errorReporter", function () {
  return  {
    restrict: "AE",
    link: function (scope, element) {
      scope.$watch("errorReporter.active", function (active) {
        if (element.hasClass('centered')) {
          var $element = $(element[0]);
          $element.css("margin-left", - 0.5 * $element.outerWidth() + "px");
        }
        element.toggleClass("ng-hide", !active);
      });
    }
  };
})

.run(function ($rootScope) {
  $rootScope.errorReporter = {};
});

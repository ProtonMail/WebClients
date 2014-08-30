angular.module("proton.errorReporter", [])
.factory("errorReporter", function ($log, $rootScope, $q) {
  var api = _.bindAll({
    catcher: function (msg, promise) {
      return function (error) {
        this.notify(msg, error);
        if (promise) {
          promise.reject();
        }
      };
    },
    resolve: function (msg, promise, defaultResult) {
      var q = $q.defer();
      promise.then(
        function (result) {
          q.resolve(result);
        },
        function (error) {
          this.notify(msg, error);
          q.resolve(defaultResult);
        }
      );

      return q.promise;
    },
    notify: function (msg, error) {
      $log.error(error.error_description);
      if (msg) {
        $rootScope.errorReporter.active = true;
        $rootScope.errorReporter.error = msg;
      }
    },
    clear: function () {
      $rootScope.errorReporter.active = false;
    }
  });
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

angular.module("proton.errorReporter", [])
.factory("errorReporter", function ($log, $rootScope, $q) {
  var api = _.bindAll({
    catcher: function (msg, promise) {
      // console.log('catcher');
      var self = this;
      return function (error) {
        self.notify(msg, error);
        if (promise) {
          promise.reject();
        }
      };
    },
    resolve: function (msg, promise, defaultResult) {
      // console.log('resolve');
      var q = $q.defer();
      var self = this;
      promise.then(
        function (result) {
          q.resolve(result);
        },
        function (error) {
          self.notify(msg, error);
          q.resolve(defaultResult);
        }
      );

      return q.promise;
    },
    notify: function (msg, error) {
      // console.log('notify');
      $log.error(error);

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

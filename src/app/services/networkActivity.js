angular.module("proton.networkActivity", ["proton.errorReporter"])
.factory("networkActivityTracker", function ($log, errorReporter) {
  var promises = [];
  var api = {
    loading: function () {
      return !_.isEmpty(promises);
    },
    track: function (promise) {
      errorReporter.clear();
      promises = _.union(promises, [promise]);
      promise.finally(function () {
        promises = _.without(promises, promise);
      });
      return promise;
    }
  };
  return api;
});

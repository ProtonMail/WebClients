angular.module("proton.networkActivity", [])
.factory("networkActivityTracker", function () {
  var promises = [];
  var api = {
    loading: function () {
      return !_.isEmpty(promises);
    },
    track: function (promise) {
      promises = _.union(promises, [promise]);
      promise.finally(function () {
        promises = _.without(promises, promise);
      });
      return promise;
    }
  };
  return api;
});

angular.module("proton.models.events", [])
	.factory("Events", function ($http, $rootScope) {
		return {
			get: function (id) {
				return $http.get($rootScope.baseURL + '/events/' + id);
			},
			getLatestID: function () {
				return $http.get($rootScope.baseURL + '/events/latest');
			}
		};
	});

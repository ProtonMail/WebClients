angular.module("proton.models.events", [])
	.factory("Events", function ($http, authentication) {
		return {
			get: function (id) {
				return $http.get(authentication.baseURL + '/events/' + id);
			},
			getLatestID: function () {
				return $http.get(authentication.baseURL + '/events/latest');
			}
		};
	});

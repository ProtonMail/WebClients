angular.module("proton.models.events", [])
	.factory("Events", function ($http, url) {
		return {
			get: function (id) {
				return $http.get(url.get() + '/events/' + id);
			},
			getLatestID: function () {
				return $http.get(url.get() + '/events/latest');
			}
		};
	});

angular.module("proton.models.events", [])
	.factory("Events", function ($http) {
		return {
			get: function (eventID) {
				return $http.get(authentication.baseURL + '/events/' + eventID);
			}
		};
	});

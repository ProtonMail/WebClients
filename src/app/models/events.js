angular.module('proton.models.events', [])
	.factory('Events', ($http, url, authentication) => {
		function transformResponseGet(data, headersGetter, status) {
			if (data) {
				data = angular.fromJson(data);
				const {Code, User = {}} = data;

				if (Code === 1000) {
					const {ViewMode = authentication.user.ViewMode} = User;

					if (ViewMode !== authentication.user.ViewMode) {
						data.Refresh = 1;
					}
				}
			}

			return data;
		}

		return {
			get(id) {
				return $http.get(url.get() + '/events/' + id);
			},
			getLatestID() {
				return $http.get(url.get() + '/events/latest');
			}
		};
	});

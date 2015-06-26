angular.module("proton.event", [])
	.service("eventManager", function ($interval, $state, $stateParams, CONSTANTS, Events) {
		var eventModel = {
			get: function (id) {
				if (angular.isUndefined(id)) {
					id = this.ID;
				}
				return Events.get(id).$promise;
			},
			isDifferent: function (eventID) {
				return this.ID !== eventID;
			},
			manage: function (result) {
				if (this.isDifferent(result.EventID)){
					console.log(events);
					var inInbox = $state.is('secured.inbox');
					var inSent = $state.is('secured.sent');
					var page = $stateParams.page || 1;

					if ((inInbox && page < 3) || (inSent && page === 1)) {
					}
					else {
						// var current =
					}
				}
			}
		};
		var api = _.bindAll({
				start: function (eventID) {
					eventModel.ID = eventID;
					eventModel.promise = $interval(function () {
						eventModel.get().then(function (result) {
							eventModel.manage(result);
						});
					}, CONSTANTS.INTERVAL_EVENT_TIMER);
				},
				stop: function () {
					if (angular.isDefinded(eventModel.promise)) {
						$interval.cancel(eventModel.promise);
					}
				}

		});

		return api;
	});

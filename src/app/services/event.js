angular.module("proton.event", [])
	.service("eventManager", function ($interval, $state, $rootScope, $stateParams, authentication, Contact, CONSTANTS, Events, messageCache) {
		var DELETE = 0;
		var CREATE = 1;
		var UPDATE = 2;
		var UPDATE_FLAG = 3;
		var EVENT_ID = "proton:eventid";
		var eventModel = {
			get: function() {
				return Events.get(this.ID);
			},
			isDifferent: function (eventID) {
				return this.ID !== eventID;
			},
			manageLabels: function(labels) {
				if (angular.isDefined(labels)) {
					_.each(labels, function(label) {
						if(label.Action === DELETE) {
							authentication.user.Labels = _.filter(authentication.user.Labels, function(l) { return l.ID !== label.ID; });
							$rootScope.$broadcast('updateLabels');
						} else if(label.Action === CREATE) {
							authentication.user.Labels.push(label.Label);
						} else if(label.Action === UPDATE) {
							var index = _.findIndex(authentication.user.Labels, function(l) { return l.ID === label.Label.ID; });
							authentication.user.Labels[index] = _.extend(authentication.user.Labels[index], label.Label);
						}
					});
				}
			},
			manageContacts: function(contacts) {
				if (angular.isDefined(contacts)) {
					_.each(contacts, function(contact) {
						if(contact.Action === DELETE) {
							$rootScope.user.Contacts = _.filter($rootScope.user.Contacts, function(c) { return c.ID !== contact.ID; });
						} else if(contact.Action === CREATE) {
							$rootScope.user.Contacts.push(contact.Contact);
						} else if (contact.Action === UPDATE) {
							var index = _.findIndex($rootScope.user.Contacts, function(c) { return c.ID === contact.Contact.ID; });
							$rootScope.user.Contacts[index] = contact.Contact;
						}
						$rootScope.$broadcast('updateContacts');
						Contact.index.updateWith($rootScope.user.Contacts);
					});
				}
			},
			manageUser: function(user) {
				if(angular.isDefined(user)) {
					authentication.user = _.extend(authentication.user, user);
				}
			},
			manageCounter: function(json) {
				if(angular.isDefined(json)) {
					var counters = {Labels:{}, Locations:{}};
		            _.each(json.Labels, function(obj) { counters.Labels[obj.LabelID] = obj.Count; });
		            _.each(json.Locations, function(obj) { counters.Locations[obj.Location] = obj.Count; });
                    $rootScope.counters  = counters;
				}
			},
			manageMessages: function(messages) {
				if (angular.isDefined(messages)) {
					messageCache.set(messages);
				}
			},
			manageStorage: function(storage) {
				authentication.user.UsedSpace = storage;
			},
			manageID: function(id) {
				this.ID = id;
				window.sessionStorage[EVENT_ID] = id;
			},
			manage: function (data) {
				// Check if eventID is sent
				if (data.Error) {
					console.log(data.Error);
				} else if (data.Refresh === 1) {
					messageCache.reset();
				} else if (this.isDifferent(data.EventID)){
					console.log(data);
					this.manageLabels(data.Labels);
					this.manageContacts(data.Contacts);
					this.manageUser(data.User);
					this.manageCounter(data.Unread);
					this.manageMessages(data.Messages);
					this.manageStorage(data.UsedSpace);
					this.manageID(data.EventID);
				}
			}
		};
		var api = _.bindAll({
				start: function () {
					eventModel.ID = window.sessionStorage[EVENT_ID];
					interval = function() {
						eventModel.get().then(function (result) {
							eventModel.manage(result.data);
						});
					};
					interval();
					eventModel.promiseCancel = $interval(interval, CONSTANTS.INTERVAL_EVENT_TIMER);
				},
				stop: function () {
					if (angular.isDefinded(eventModel.promiseCancel)) {
						$interval.cancel(eventModel.promiseCancel);
					}
				}

		});

		return api;
	});

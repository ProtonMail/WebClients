angular.module("proton.event", [])
	.service("eventManager", function ($interval, $state, $stateParams, Contact, CONSTANTS, Events) {
		var DELETE = 0;
		var CREATE = 1;
		var UPDATE = 2;
		var EVENT_ID = "proton:eventid";
		var eventModel = {
			get: function() {
				return Events.get(this.ID).$promise;
			},
			isDifferent: function (eventID) {
				return this.ID !== eventID;
			},
			manageLabels: function(labels) {
				_.each(labels, function(label) {
					if(label.Action === DELETE) {
						authentication.user.Labels = _.filter(authentication.user.Labels, function(l) { return l.ID !== label.Label.ID; });
					} else if(label.Action === CREATE) {
						authentication.user.Labels.push(label.Label);
					} else if(label.Action === UPDATE) {
						var index = _.findIndex(authentication.user.Labels, function(l) { return l.ID === label.Label.ID; });
						authentication.user.Labels[index] = label.Label;
					}
				});
			},
			manageContacts: function(contacts) {
				_.each(contacts, function(contact) {
					if(contact.Action === DELETE) {
						authentication.user.Contacts = _.filter(authentication.user.Contacts, function(c) { return c.ID !== contact.Contact.ID; });
					} else if(contact.Action === CREATE) {
						authentication.user.Contacts.push(contact.Contact);
					} else if (contact.Action === UPDATE) {
						var index = _.findIndex(authentication.user.Contacts, function(c) { return c.ID === contact.Contact.ID; });
						authentication.user.Contacts[index] = contact.Contact;
					}
					Contact.index.updateWith(authentication.user.Contacts);
				});
			},
			manageUser: function(user) {
				if(angular.isDefined(user)) {
					authentication.user = _.extend(authentication.user, user);
				}
			},
			manageCounter: function(counters) {
				if(angular.isDefined(counters)) {
                    $rootScope.counters  = counters;
				}
			},
			manageMessages: function(messages) {
				// Update caching
				messageCache.set(messages);
			},
			manageID: function(id) {
				this.ID = id;
				window.sessionStorage[EVENT_ID] = id;
			},
			manage: function (result) {
				if (this.isDifferent(result.EventID)){
					this.manageLabels(result.Labels);
					this.manageContacts(result.Contacts);
					this.manageUser(result.User);
					this.manageCounter(result.Unread);
					this.manageMessages(result.Messages);
					this.manageID(result.EventID);
				}
			}
		};
		var api = _.bindAll({
				start: function () {
					eventModel.ID = window.sessionStorage[EVENT_ID];
					eventModel.promiseCancel = $interval(function () {
						eventModel.get().then(function (result) {
							eventModel.manage(result);
						});
					}, CONSTANTS.INTERVAL_EVENT_TIMER);
				},
				stop: function () {
					if (angular.isDefinded(eventModel.promiseCancel)) {
						$interval.cancel(eventModel.promiseCancel);
					}
				}

		});

		return api;
	});

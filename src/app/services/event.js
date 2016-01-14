angular.module("proton.event", ["proton.constants"])
	.service("eventManager", function (
		$timeout,
		$window,
		$state,
		$rootScope,
		$stateParams,
		$cookies,
		$log,
		authentication,
		cache,
		cacheCounters,
		Contact,
		CONSTANTS,
		Events,
		notify
	) {

		function getRandomInt(min, max) {
		    return Math.floor(Math.random() * (max - min + 1)) + min;
		}

		var DELETE = 0;
		var CREATE = 1;
		var UPDATE = 2;
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
						var index;

						if(label.Action === DELETE) {
							index = _.findIndex(authentication.user.Labels, function(l) { return l.ID === label.ID; });

							if(index !== -1) {
								authentication.user.Labels.splice(index, 1);
							}
						} else if(label.Action === CREATE) {
							authentication.user.Labels.push(label.Label);
							cacheCounters.add(label.Label.ID);
						} else if(label.Action === UPDATE) {
							index = _.findIndex(authentication.user.Labels, function(l) { return l.ID === label.Label.ID; });

							if(index !== -1) {
								authentication.user.Labels[index] = _.extend(authentication.user.Labels[index], label.Label);
							}
						}
					});
				}
			},
			manageContacts: function(contacts) {
				if (angular.isDefined(contacts)) {
					_.each(contacts, function(contact) {
						if(contact.Action === DELETE) {
							authentication.user.Contacts = _.filter(authentication.user.Contacts, function(c) { return c.ID !== contact.ID; });
						} else if(contact.Action === CREATE) {
							authentication.user.Contacts.push(contact.Contact);
						} else if (contact.Action === UPDATE) {
							var index = _.findIndex(authentication.user.Contacts, function(c) { return c.ID === contact.Contact.ID; });
							authentication.user.Contacts[index] = contact.Contact;
						}
						$rootScope.$broadcast('updateContacts');
					});
				}
			},
			manageUser: function(user) {
				if(angular.isDefined(user)) {
					authentication.user = angular.merge(authentication.user, user);
				}
			},
			manageMessageCounts: function(counts) {
				if(angular.isDefined(counts)) {
					_.each(counts, function(count) {
						cacheCounters.updateMessage(count.LabelID, count.Total, count.Unread);
					});
				}
			},
			manageConversationCounts: function(counts) {
				if(angular.isDefined(counts)) {
					_.each(counts, function(count) {
						cacheCounters.updateConversation(count.LabelID, count.Total, count.Unread);
					});
				}
			},
			manageThreadings: function(messages, conversations) {
				var events = [];

				if(angular.isArray(messages)) {
					events = events.concat(messages);
				}

				if(angular.isArray(conversations)) {
					events = events.concat(conversations);
				}

				if(events.length > 0) {
					cache.events(events, true);
				}
			},
			manageStorage: function(storage) {
				if(angular.isDefined(storage)) {
					authentication.user.UsedSpace = storage;
				}
			},
			manageID: function(id) {
				this.ID = id;
				window.sessionStorage[CONSTANTS.EVENT_ID] = id;
			},
			manageNotices: function(notices) {
				if(angular.isDefined(notices) && notices.length > 0) {
					for(var i = 0; i < notices.length; i++) {
						var message = notices[i];
						var cookie_name = 'NOTICE-'+openpgp.util.hexidump(openpgp.crypto.hash.md5(openpgp.util.str2Uint8Array(message)));

						if ( !$cookies.get( cookie_name ) ) {
							notify({
								message: message,
								duration: '0'
							});

							// 2 week expiration
							var now = new Date();
							var expires = new Date(now.getFullYear(), now.getMonth(), now.getDate()+14);

							$cookies.put(cookie_name, 'true', { expires: expires });
						}
					}
				}
			},
			manage: function (data) {
				// Check if eventID is sent
				if (data.Error) {
					Events.getLatestID({}).then(function(response) {
						eventModel.manageID(response.data.EventID);
					});
				} else if (data.Refresh === 1) {
					cache.reset();
					eventModel.manageID(data.EventID);
				} else if (data.Reload === 1) {
					$window.location.reload();
				} else if (this.isDifferent(data.EventID)) {
					this.manageLabels(data.Labels);
					this.manageContacts(data.Contacts);
					this.manageUser(data.User);
					this.manageThreadings(data.Messages, data.Conversations);
					this.manageMessageCounts(data.MessageCounts);
					this.manageConversationCounts(data.ConversationCounts);
					this.manageStorage(data.UsedSpace);
					this.manageID(data.EventID);
				}
				this.manageNotices(data.Notices);
				cache.expiration();
			},
			interval: function() {
				eventModel.get().then(function (result) {
					// Check for force upgrade
					if (angular.isDefined(result.data) && result.data.Code === 5003) {
						// Force upgrade, kill event loop
						eventModel.promiseCancel = undefined;
					} else {
						// Schedule next event API call, do it here so a crash in managing events doesn't kill the loop forever
						if ( angular.isDefined(eventModel.promiseCancel) ) {
							eventModel.promiseCancel = $timeout(eventModel.interval, CONSTANTS.INTERVAL_EVENT_TIMER);
						}

						eventModel.manage(result.data);
					}
				},
				function(err) {
					// Try again later
					if ( angular.isDefined(eventModel.promiseCancel) ) {
						eventModel.promiseCancel = $timeout(eventModel.interval, CONSTANTS.INTERVAL_EVENT_TIMER);
					}
				});
			}
		};

		var api = _.bindAll({
			start: function () {
				if (angular.isUndefined(eventModel.promiseCancel)) {
					eventModel.ID = window.sessionStorage[CONSTANTS.EVENT_ID];
					eventModel.promiseCancel = $timeout(eventModel.interval, 0);
				}
			},
			call: function() {
				eventModel.interval();
			},
			stop: function () {
				if (angular.isDefined(eventModel.promiseCancel)) {
					$timeout.cancel(eventModel.promiseCancel);
					eventModel.promiseCancel = undefined;
				}
			}
		}, 'start', 'call', 'stop');

		return api;
	});

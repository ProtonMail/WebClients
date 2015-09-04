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
		Contact,
		CONSTANTS,
		Events,
		messageCache,
		messageCounts,
		notify
	) {

		function getRandomInt(min, max) {
		    return Math.floor(Math.random() * (max - min + 1)) + min;
		}

		var DELETE = 0;
		var CREATE = 1;
		var UPDATE = 2;
		var UPDATE_FLAG = 3;
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
							authentication.user.Contacts = _.filter(authentication.user.Contacts, function(c) { return c.ID !== contact.ID; });
						} else if(contact.Action === CREATE) {
							authentication.user.Contacts.push(contact.Contact);
						} else if (contact.Action === UPDATE) {
							var index = _.findIndex(authentication.user.Contacts, function(c) { return c.ID === contact.Contact.ID; });
							authentication.user.Contacts[index] = contact.Contact;
						}
						$rootScope.$broadcast('updateContacts');
						Contact.index.updateWith(authentication.user.Contacts);
					});
				}
			},
			manageUser: function(user) {
				if(angular.isDefined(user)) {
					authentication.user = angular.merge(authentication.user, user);
				}
			},
			manageCounter: function(json) {
				if(angular.isDefined(json)) {
					var counters = {Labels:{}, Locations:{}, Starred: json.Starred};

					if (messageCounts.unreadChangedLocally) {
						messageCounts.unreadChangedLocally = false;
					} else {
			            _.each(json.Labels, function(obj) { counters.Labels[obj.LabelID] = obj.Count; });
			            _.each(json.Locations, function(obj) { counters.Locations[obj.Location] = obj.Count; });
                    	messageCounts.update(counters);
					}
				}
			},
			manageTotals: function(totals) {
				if(angular.isDefined(totals)) {
					var total = {Labels:{}, Locations:{}, Starred: totals.Starred};

					if (messageCounts.totalChangedLocally) {
						messageCounts.totalChangedLocally = false;
					} else {
						_.each(totals.Labels, function(obj) { total.Labels[obj.LabelID] = obj.Count; });
						_.each(totals.Locations, function(obj) { total.Locations[obj.Location] = obj.Count; });
						$rootScope.messageTotals = total;
					}
				}
			},
			manageMessages: function(messages) {
				if (angular.isDefined(messages)) {
					messageCache.set(messages);
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
				if(angular.isDefined(notices)) {
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
					messageCache.reset();
					eventModel.manageID(data.EventID);
				} else if (data.Reload === 1) {
					$window.location.reload();
				} else if (this.isDifferent(data.EventID)) {
					this.manageLabels(data.Labels);
					this.manageContacts(data.Contacts);
					this.manageUser(data.User);
					this.manageCounter(data.Unread);
 					this.manageTotals(data.Total);
					this.manageMessages(data.Messages);
					this.manageStorage(data.UsedSpace);
					this.manageID(data.EventID);
				}
				this.manageNotices(data.Notices);
				messageCache.manageExpire();
			},
			interval: function() {
				eventModel.get().then(function (result) {

					// Check for force upgrade
					if ( angular.isDefined(result.data) && angular.isDefined(result.data.Code) && parseInt(result.data.Code) === 5003 ) {
						// Force upgrade, kill event loop
						eventModel.promiseCancel = undefined;
						return;
					}

					// Schedule next event API call, do it here so a crash in managing events doesn't kill the loop forever
					if ( angular.isDefined(eventModel.promiseCancel) ) {
						eventModel.promiseCancel = $timeout(eventModel.interval, CONSTANTS.INTERVAL_EVENT_TIMER);
					}

					eventModel.manage(result.data);
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
				stop: function () {
					messageCache.empty();
					if (angular.isDefined(eventModel.promiseCancel)) {
						$timeout.cancel(eventModel.promiseCancel);
						eventModel.promiseCancel = undefined;
					}
				}

		});

		return api;
	});

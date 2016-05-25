angular.module("proton.event", ["proton.constants"])
	.service("eventManager", function (
		$cookies,
		$location,
		$log,
		$q,
		$rootScope,
		$state,
		$stateParams,
		$timeout,
		$window,
		authentication,
		cache,
		cacheCounters,
		CONSTANTS,
		Contact,
		desktopNotifications,
		Events,
		generateModal,
		gettextCatalog,
		Label,
		notify,
		pmcw
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
						var index = _.findIndex(authentication.user.Labels, {ID: label.ID});

						if(label.Action === DELETE) {
							if (index !== -1) {
								authentication.user.Labels.splice(index, 1);
								$rootScope.$broadcast('deleteLabel', label.ID);
							}
						} else if(label.Action === CREATE) {
							if (index === -1) {
								authentication.user.Labels.push(label.Label);
								cacheCounters.add(label.Label.ID);
								$rootScope.$broadcast('createLabel', label.ID, label.Label);
							}
						} else if(label.Action === UPDATE) {
							if(index !== -1) {
								authentication.user.Labels[index] = label.Label;
								$rootScope.$broadcast('updateLabel', label.ID, label.Label);
							}
						}
					});
				}
			},
			manageContacts: function(contacts) {
				if (angular.isDefined(contacts)) {
					_.each(contacts, function(contact) {
						var index = _.findIndex(authentication.user.Contacts, {ID: contact.ID});

						if (contact.Action === DELETE) {
							if (index !== -1) {
								authentication.user.Contacts.splice(index, 1);
								$rootScope.$broadcast('deleteContact', contact.ID);
							}
						} else if(contact.Action === CREATE) {
							if (index === -1) {
								authentication.user.Contacts.push(contact.Contact);
								$rootScope.$broadcast('createContact', contact.ID, contact.Contact);
							}
						} else if (contact.Action === UPDATE) {
							if (index !== -1) {
								authentication.user.Contacts[index] = contact.Contact;
								$rootScope.$broadcast('updateContact', contact.ID, contact.Contact);
							}
						}
					});
				}
			},
			manageUser: function(user) {
				if (angular.isDefined(user)) {
					var mailboxPassword = authentication.getPassword();
					var promises = [];
					var dirtyAddresses = [];
					var privateUser = user.Private === 1;
					var keyInfo = function(key) {
						return pmcw.keyInfo(key.PrivateKey)
						.then(function(info) {
							key.created = info.created; // Creation date
							key.bitSize = info.bitSize; // We don't use this data currently
							key.fingerprint = info.fingerprint; // Fingerprint

							return $q.resolve(key);
						});
					};

					_.each(user.Addresses, function(address) {
						if (address.Keys.length === 0 && address.Status === 1 && privateUser === true) {
							dirtyAddresses.push(address);
						} else {
							_.each(address.Keys, function(key, index) {
								promises.push(pmcw.decryptPrivateKey(key.PrivateKey, mailboxPassword).then(function(package) { // Decrypt private key with the mailbox password
									key.decrypted = true; // We mark this key as decrypted
									authentication.storeKey(address.ID, key.ID, package); // We store the package to the current service

									return keyInfo(key);
								}, function(error) {
									key.decrypted = false; // This key is not decrypted
									// If the primary (first) key for address does not decrypt, display error.
									if(index === 0) {
										address.disabled = true; // This address cannot be used
										notify({message: 'Primary key for address ' + address.Email + ' cannot be decrypted. You will not be able to read or write any email from this address', classes: 'notification-danger'});
									}

									return keyInfo(key);
								}));
							});
						}
					});

					if (dirtyAddresses.length > 0 && generateModal.active() === false) {
						generateModal.activate({
							params: {
								title: 'Setting up your Addresses',
				                message: 'Before you can start sending and receiving emails from your new addresses you need to create encryption keys for them. Simply select your preferred encryption strength and click "Generate Keys".', // TODO need text
								addresses: dirtyAddresses,
								cancel: function() {
									api.call();
									generateModal.deactivate();
								}
							}
						});
					}

					$q.all(promises).finally(function() {
						// Merge user parameters
						_.each(Object.keys(user), function(key) {
							if (key === 'Addresses') {
								_.each(user.Addresses, function(address) {
									var index = _.findIndex(authentication.user.Addresses, {ID: address.ID});

									if (index === -1) {
										authentication.user.Addresses.push(address);
									} else {
										angular.extend(authentication.user.Addresses[index], address);
									}
								});

								var index = authentication.user.Addresses.length;

								while (index--) {
									var address = authentication.user.Addresses[index];
									var found = _.findWhere(user.Addresses, {ID: address.ID});

									if (angular.isUndefined(found)) {
										authentication.user.Addresses.splice(index, 1);
									}
								}
							} else {
								authentication.user[key] = user[key];
							}
						});

						angular.extend($rootScope.user, authentication.user);
						$rootScope.$broadcast('updateUser');
					});
				}
			},
			manageMessageCounts: function(counts) {
				if(angular.isDefined(counts)) {
					var labelIDs = ['0', '1', '2', '3', '4', '6', '10'].concat(_.map(authentication.user.Labels, function(label) { return label.ID; }) || []);

					_.each(labelIDs, function(labelID) {
						var count = _.findWhere(counts, {LabelID: labelID});

						if(angular.isDefined(count)) {
							cacheCounters.updateMessage(count.LabelID, count.Total, count.Unread);
						} else {
							cacheCounters.updateMessage(labelID, 0, 0);
						}
					});
				}
			},
			manageConversationCounts: function(counts) {
				if(angular.isDefined(counts)) {
					var labelIDs = ['0', '1', '2', '3', '4', '6', '10'].concat(_.map(authentication.user.Labels, function(label) { return label.ID; }) || []);

					_.each(labelIDs, function(labelID) {
						var count = _.findWhere(counts, {LabelID: labelID});

						if(angular.isDefined(count)) {
							cacheCounters.updateConversation(count.LabelID, count.Total, count.Unread);
						} else {
							cacheCounters.updateConversation(labelID, 0, 0);
						}
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
			manageDesktopNotifications: function(messages) {
				if (angular.isDefined(messages)) {
					_.each(messages, function(message) {
						if (message.Action === 1 && message.Message.Type === 0) {
							desktopNotifications.create(gettextCatalog.getString('You have a new email', null, 'Info'), {
					            body: message.Message.Subject,
					            icon: '/assets/img/notification-badge.gif'
					        });
						}
					});
				}
			},
			manageStorage: function(storage) {
				if(angular.isDefined(storage)) {
					authentication.user.UsedSpace = storage;
				}
			},
			manageMembers: function(members) {
				if (angular.isDefined(members)) {
					_.each(members, function(member) {
						if (member.Action === DELETE) {
							$rootScope.$broadcast('deleteMember', member.ID);
						} else if (member.Action === CREATE) {
							$rootScope.$broadcast('createMember', member.ID, member.Member);
						} else if (member.Action === UPDATE) {
							$rootScope.$broadcast('updateMember', member.ID, member.Member);
						}
					});
				}
			},
			manageDomains: function(domains) {
				if (angular.isDefined(domains)) {
					_.each(domains, function(domain) {
						if (domain.Action === DELETE) {
							$rootScope.$broadcast('deleteDomain', domain.ID);
						} else if (domain.Action === CREATE) {
							$rootScope.$broadcast('createDomain', domain.ID, domain.Domain);
						} else if (domain.Action === UPDATE) {
							$rootScope.$broadcast('updateDomain', domain.ID, domain.Domain);
						}
					});
				}
			},
			manageOrganization: function(organization) {
				if (angular.isDefined(organization)) {
					$rootScope.$broadcast('organizationChange', organization);
				}
			},
			manageID: function(id) {
				this.ID = id;
				window.sessionStorage[CONSTANTS.EVENT_ID] = id;
			},
			manageNotices: function(notices) {
				if(angular.isDefined(notices) && notices.length > 0) {
					// 2 week expiration
					var now = new Date();
					var expires = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14);
					var onClose = function(cookie_name) {
						$cookies.put(cookie_name, 'true', { expires: expires });
					};

					for (var i = 0; i < notices.length; i++) {
						var message = notices[i];
						var cookie_name = 'NOTICE-'+openpgp.util.hexidump(openpgp.crypto.hash.md5(openpgp.util.str2Uint8Array(message)));

						if (!$cookies.get(cookie_name)) {
							notify({
								message: message,
							    templateUrl: 'templates/notifications/cross.tpl.html',
								duration: '0',
								onClose: onClose(cookie_name)
							});
						}
					}
				}
			},
			manage: function (data) {
				// Check if eventID is sent
				if (data.Error) {
					Events.getLatestID({})
					.then(function(response) {
						eventModel.manageID(response.data.EventID);
					});
				} else if (data.Refresh === 1) {
					eventModel.manageID(data.EventID);
					cache.reset();
					cacheCounters.reset();
					cache.callRefresh();
					cacheCounters.query();
					authentication.fetchUserInfo()
					.then(function() {
						$rootScope.$broadcast('updateUser');
						$rootScope.$broadcast('updateContacts');
						$rootScope.$broadcast('updateLabels');
					});
				} else if (data.Reload === 1) {
					$window.location.reload();
				} else if (this.isDifferent(data.EventID)) {
					this.manageLabels(data.Labels);
					this.manageContacts(data.Contacts);
					this.manageUser(data.User);
					this.manageThreadings(data.Messages, data.Conversations);
					// this.manageDesktopNotifications(data.Messages);
					this.manageMessageCounts(data.MessageCounts);
					this.manageConversationCounts(data.ConversationCounts);
					this.manageStorage(data.UsedSpace);
					this.manageDomains(data.Domains);
					this.manageMembers(data.Members);
					this.manageOrganization(data.Organization);
					this.manageID(data.EventID);
				}

				this.manageNotices(data.Notices);
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
				return eventModel.get().then(function (result) {
					if (result.data && result.data.Code === 1000) {
						eventModel.manage(result.data);
					}
				});
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

angular.module('proton.event', ['proton.constants', 'proton.storage'])
    .service('eventManager', (
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
    ) => {

        const DELETE = 0;
        const CREATE = 1;
        const UPDATE = 2;
        const eventModel = {
            get() {
                if (this.ID) {
                    return Events.get(this.ID);
                }
                return Events.getLatestID();
            },
            isDifferent(eventID) {
                return this.ID !== eventID;
            },
            manageLabels(labels) {
                if (angular.isDefined(labels)) {
                    _.each(labels, (label) => {
                        const index = _.findIndex(authentication.user.Labels, { ID: label.ID });

                        if (label.Action === DELETE) {
                            if (index !== -1) {
                                authentication.user.Labels.splice(index, 1);
                                $rootScope.$emit('deleteLabel', label.ID);
                            }
                        } else if (label.Action === CREATE) {
                            if (index === -1) {
                                authentication.user.Labels.push(label.Label);
                                cacheCounters.add(label.Label.ID);
                                $rootScope.$emit('createLabel', label.ID, label.Label);
                            }
                        } else if (label.Action === UPDATE) {
                            if (index !== -1) {
                                authentication.user.Labels[index] = label.Label;
                                $rootScope.$emit('updateLabel', label.ID, label.Label);
                            }
                        }
                    });
                }
            },
            manageContacts(contacts) {
                if (angular.isDefined(contacts)) {
                    _.each(contacts, (contact) => {
                        const index = _.findIndex(authentication.user.Contacts, { ID: contact.ID });

                        if (contact.Action === DELETE) {
                            if (index !== -1) {
                                authentication.user.Contacts.splice(index, 1);
                                $rootScope.$broadcast('deleteContact', contact.ID);
                            }
                        } else if (contact.Action === CREATE) {
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
            manageUser(user) {
                if (angular.isDefined(user)) {
                    const mailboxPassword = authentication.getPassword();
                    const promises = [];
                    const dirtyAddresses = [];
                    const privateUser = user.Private === 1;
                    const keyInfo = function (key) {
                        return pmcw.keyInfo(key.PrivateKey)
                        .then((info) => {
                            key.created = info.created; // Creation date
                            key.bitSize = info.bitSize; // We don't use this data currently
                            key.fingerprint = info.fingerprint; // Fingerprint

                            return $q.resolve(key);
                        });
                    };

                    if (user.Role === 0) {
                        // Necessary because there is no deletion event for organizations
                        $rootScope.$broadcast('organizationChange', { PlanName: 'free' });
                    }

                    _.each(user.Addresses, (address) => {
                        if (address.Keys.length === 0 && address.Status === 1 && privateUser === true) {
                            dirtyAddresses.push(address);
                        } else {
                            _.each(address.Keys, (key, index) => {
                                promises.push(pmcw.decryptPrivateKey(key.PrivateKey, mailboxPassword).then((pkg) => { // Decrypt private key with the mailbox password
                                    key.decrypted = true; // We mark this key as decrypted
                                    authentication.storeKey(address.ID, key.ID, pkg); // We store the package to the current service

                                    return keyInfo(key);
                                }, () => {
                                    key.decrypted = false; // This key is not decrypted
                                    // If the primary (first) key for address does not decrypt, display error.
                                    if (index === 0) {
                                        address.disabled = true; // This address cannot be used
                                        notify({ message: 'Primary key for address ' + address.Email + ' cannot be decrypted. You will not be able to read or write any email from this address', classes: 'notification-danger' });
                                    }

                                    return keyInfo(key);
                                }));
                            });
                        }
                    });

                    if (dirtyAddresses.length > 0 && generateModal.active() === false) {
                        generateModal.activate({
                            params: {
                                title: gettextCatalog.getString('Setting up your Addresses', null, 'Title'),
                                message: gettextCatalog.getString('Before you can start sending and receiving emails from your new addresses you need to create encryption keys for them. Simply select your preferred encryption strength and click "Generate Keys".', null, 'Info'),
                                addresses: dirtyAddresses,
                                password: authentication.getPassword(),
                                close(success) {
                                    if (success) {
                                        /* eslint no-use-before-define: "off" */
                                        api.call();
                                    }

                                    generateModal.deactivate();
                                }
                            }
                        });
                    }

                    $q.all(promises).finally(() => {
                        // Merge user parameters
                        _.each(Object.keys(user), (key) => {
                            if (key === 'Addresses') {
                                _.each(user.Addresses, (address) => {
                                    const index = _.findIndex(authentication.user.Addresses, { ID: address.ID });

                                    if (index === -1) {
                                        authentication.user.Addresses.push(address);
                                        $rootScope.$broadcast('createUser');
                                    } else {
                                        angular.extend(authentication.user.Addresses[index], address);
                                    }
                                });

                                let index = authentication.user.Addresses.length;

                                while (index--) {
                                    const address = authentication.user.Addresses[index];
                                    const found = _.findWhere(user.Addresses, { ID: address.ID });

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
            manageMessageCounts(counts) {
                if (angular.isDefined(counts)) {
                    const labelIDs = ['0', '1', '2', '3', '4', '6', '10']
                        .concat(_.map(authentication.user.Labels || [], ({ ID }) => ID));

                    _.each(labelIDs, (labelID) => {
                        const count = _.findWhere(counts, { LabelID: labelID });

                        if (angular.isDefined(count)) {
                            cacheCounters.updateMessage(count.LabelID, count.Total, count.Unread);
                        } else {
                            cacheCounters.updateMessage(labelID, 0, 0);
                        }
                    });

                    $rootScope.$emit('messages.counter');
                }
            },
            manageConversationCounts(counts) {
                if (angular.isDefined(counts)) {
                    const labelIDs = ['0', '1', '2', '3', '4', '6', '10']
                        .concat(_.map(authentication.user.Labels || [], ({ ID }) => ID));

                    _.each(labelIDs, (labelID) => {
                        const count = _.findWhere(counts, { LabelID: labelID });

                        if (angular.isDefined(count)) {
                            cacheCounters.updateConversation(count.LabelID, count.Total, count.Unread);
                        } else {
                            cacheCounters.updateConversation(labelID, 0, 0);
                        }
                    });

                    $rootScope.$emit('conversations.counter');
                }
            },
            manageThreadings(messages, conversations) {
                let events = [];

                if (angular.isArray(messages)) {
                    events = events.concat(messages);
                }

                if (angular.isArray(conversations)) {
                    events = events.concat(conversations);
                }

                if (events.length > 0) {
                    cache.events(events, true);
                }
            },
            manageDesktopNotifications(messages) {
                if (angular.isDefined(messages)) {
                    _.each(messages, (message) => {
                        if (message.Action === 1 && message.Message.IsRead === 0 && message.Message.LabelIDs.indexOf(CONSTANTS.MAILBOX_IDENTIFIERS.inbox) !== -1) {
                            const title = gettextCatalog.getString('New mail from', null, 'Info') + ' ' + message.Message.Sender.Name || message.Message.Sender.Address;

                            desktopNotifications.create(title, {
                                body: message.Message.Subject,
                                icon: '/assets/img/notification-badge.gif',
                                onClick() {
                                    window.focus();
                                }
                            });
                        }
                    });
                }
            },
            manageStorage(storage) {
                if (angular.isDefined(storage)) {
                    authentication.user.UsedSpace = storage;
                }
            },
            manageMembers(members) {
                if (angular.isDefined(members)) {
                    _.each(members, (member) => {
                        if (member.Action === DELETE) {
                            $rootScope.$emit('deleteMember', member.ID);
                        } else if (member.Action === CREATE) {
                            $rootScope.$emit('createMember', member.ID, member.Member);
                        } else if (member.Action === UPDATE) {
                            $rootScope.$emit('updateMember', member.ID, member.Member);
                        }
                    });
                }
            },
            manageDomains(domains) {
                if (angular.isDefined(domains)) {
                    _.each(domains, (domain) => {
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
            manageOrganization(organization) {
                if (angular.isDefined(organization)) {
                    $rootScope.$broadcast('organizationChange', organization);
                }
            },
            manageFilters(filters) {
                if (angular.isArray(filters)) {
                    _.each(filters, (filter) => {
                        if (filter.Action === DELETE) {
                            $rootScope.$broadcast('deleteFilter', filter.ID);
                        } else if (filter.Action === CREATE) {
                            filter.Filter.Simple = Sieve.fromTree(filter.Filter.Tree);
                            $rootScope.$broadcast('createFilter', filter.ID, filter.Filter);
                        } else if (filter.Action === UPDATE) {
                            filter.Filter.Simple = Sieve.fromTree(filter.Filter.Tree);
                            $rootScope.$broadcast('updateFilter', filter.ID, filter.Filter);
                        }
                    });
                }
            },
            manageID(id) {
                if (id) {
                    this.ID = id;
                }
            },
            manageNotices(notices) {
                if (angular.isDefined(notices) && notices.length > 0) {
                    // 2 week expiration
                    const now = new Date();
                    const expires = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14);
                    const onClose = (name) => $cookies.put(name, 'true', { expires });

                    for (let i = 0; i < notices.length; i++) {
                        const message = notices[i];
                        const cookieName = 'NOTICE-' + openpgp.util.hexidump(openpgp.crypto.hash.md5(openpgp.util.str2Uint8Array(message)));

                        if (!$cookies.get(cookieName)) {
                            notify({
                                message,
                                templateUrl: 'templates/notifications/cross.tpl.html',
                                duration: '0',
                                onClose: onClose(cookieName)
                            });
                        }
                    }
                }
            },
            manage(data) {
                // Check if eventID is sent
                if (data.Error) {
                    Events.getLatestID()
                    .then((result) => {
                        eventModel.manageID(result.data.EventID);
                    });
                } else if (data.Refresh === 1) {
                    eventModel.manageID(data.EventID);
                    cache.reset();
                    cacheCounters.reset();
                    cache.callRefresh();
                    cacheCounters.query();
                    authentication.fetchUserInfo()
                    .then(() => {
                        $rootScope.$broadcast('updateUser');
                        $rootScope.$broadcast('updateContacts');
                        $rootScope.$emit('updateLabels');
                    });
                } else if (data.Reload === 1) {
                    $window.location.reload();
                } else if (this.isDifferent(data.EventID)) {
                    this.manageLabels(data.Labels);
                    this.manageContacts(data.Contacts);
                    this.manageUser(data.User);
                    this.manageThreadings(data.Messages, data.Conversations);
                    this.manageDesktopNotifications(data.Messages);
                    this.manageMessageCounts(data.MessageCounts);
                    this.manageConversationCounts(data.ConversationCounts);
                    this.manageStorage(data.UsedSpace);
                    this.manageDomains(data.Domains);
                    this.manageMembers(data.Members);
                    this.manageOrganization(data.Organization);
                    this.manageFilters(data.Filters);
                    this.manageID(data.EventID);
                }

                this.manageNotices(data.Notices);
            },
            milliseconds: CONSTANTS.INTERVAL_EVENT_TIMER,
            reset: () => {
                $timeout.cancel(eventModel.promiseCancel);
                eventModel.notification && eventModel.notification.close();
                eventModel.interval();
            },
            interval() {
                return eventModel.get().then(
                    (result) => {
                        // Check for force upgrade
                        if (result.data && result.data.Code === 5003) {
                            // Force upgrade, kill event loop
                            $timeout.cancel(eventModel.promiseCancel);
                        } else {
                            eventModel.notification && eventModel.notification.close();
                            eventModel.milliseconds = CONSTANTS.INTERVAL_EVENT_TIMER;
                            eventModel.promiseCancel = $timeout(eventModel.interval, eventModel.milliseconds);
                            eventModel.manage(result.data);
                        }
                    },
                    () => {
                        if (angular.isDefined(eventModel.promiseCancel)) {
                            $timeout.cancel(eventModel.promiseCancel);
                            eventModel.notification && eventModel.notification.close();
                            /* eslint operator-assignment: "off" */
                            eventModel.milliseconds = eventModel.milliseconds * 2; // We multiplie the interval by 2
                            eventModel.promiseCancel = $timeout(eventModel.interval, eventModel.milliseconds);
                            eventModel.notification = notify({ templateUrl: 'templates/notifications/retry.tpl.html', duration: '0', onClick: eventModel.reset });
                        }
                    }
                );
            }
        };

        let api = _.bindAll({
            setEventID(ID) {
                eventModel.manageID(ID);
            },
            start() {
                if (angular.isUndefined(eventModel.promiseCancel)) {
                    eventModel.promiseCancel = $timeout(eventModel.interval, 0);
                }
            },
            call() {
                return eventModel.get()
                .then((result) => {
                    if (result.data && result.data.Code === 1000) {
                        eventModel.manage(result.data);
                    }
                });
            },
            stop() {
                $timeout.cancel(eventModel.promiseCancel);
            }
        }, 'start', 'call', 'stop');

        return api;
    });

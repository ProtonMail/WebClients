angular.module('proton.utils')
    .service('eventManager', (
        $cookies,
        $exceptionHandler,
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
        cachePages,
        CONSTANTS,
        Contact,
        desktopNotifications,
        Events,
        generateModal,
        gettextCatalog,
        Label,
        notify,
        pmcw,
        setupKeys,
        AppModel,
        labelsModel
    ) => {

        const FIBONACCI = [1, 1, 2, 3, 5, 8];
        const { DELETE, CREATE, UPDATE } = CONSTANTS.STATUS;
        const dispatch = (type, data = {}) => $rootScope.$emit('app.event', { type, data });
        const MODEL = {
            index: 0,
            milliseconds: CONSTANTS.INTERVAL_EVENT_TIMER
        };
        const closeNotifications = () => MODEL.notification && MODEL.notification.close();
        const setTimer = (timer = CONSTANTS.INTERVAL_EVENT_TIMER) => MODEL.milliseconds = timer;
        const setEventID = (ID) => manageID(ID);
        const stop = () => $timeout.cancel(MODEL.promiseCancel);
        const manageActiveMessage = ({ Messages = [] }) => Messages.length && dispatch('activeMessages', { messages: Messages.map(({ Message }) => Message) });
        const isDifferent = (eventID) => MODEL.ID !== eventID;
        const manageID = (id = MODEL.ID) => MODEL.ID = id;

        /**
         * Clean contact datas
         * @param  {Object} contact
         * @return {Object}
         */
        function cleanContact(contact = {}) {
            contact.Name = DOMPurify.sanitize(contact.Name);
            contact.Email = DOMPurify.sanitize(contact.Email);
            return contact;
        }

        function get() {
            if (MODEL.ID) {
                return Events.get(MODEL.ID);
            }
            return Events.getLatestID();
        }

        function manageContacts(contacts = []) {
            contacts.forEach((contact) => {
                const contactCleaned = cleanContact(contact.Contact);
                const index = _.findIndex(authentication.user.Contacts, { ID: contact.ID });

                if (contact.Action === DELETE) {
                    if (index !== -1) {
                        authentication.user.Contacts.splice(index, 1);
                        $rootScope.$broadcast('deleteContact', contact.ID);
                    }
                } else if (contact.Action === CREATE) {
                    if (index === -1) {
                        authentication.user.Contacts.push(contactCleaned);
                        $rootScope.$broadcast('createContact', contact.ID, contactCleaned);
                    }
                } else if (contact.Action === UPDATE) {
                    if (index !== -1) {
                        authentication.user.Contacts[index] = contactCleaned;
                        $rootScope.$broadcast('updateContact', contact.ID, contactCleaned);
                    }
                }
            });
        }

        function manageUser(user) {
            if (user) {
                const mailboxPassword = authentication.getPassword();

                if (user.Role === CONSTANTS.FREE_USER_ROLE) {
                    // Necessary because there is no deletion event for organizations
                    $rootScope.$emit('organizationChange', { PlanName: 'free', HasKeys: 0 });
                }

                const subuser = angular.isDefined(user.OrganizationPrivateKey);
                // Required for subuser
                let organizationKeyPromise = Promise.resolve();
                if (subuser) {
                    organizationKeyPromise = pmcw.decryptPrivateKey(user.OrganizationPrivateKey, mailboxPassword);
                }

                const generateKeys = (addresses) => {
                    const deferred = $q.defer();

                    generateModal.activate({
                        params: {
                            title: gettextCatalog.getString('Setting up your Addresses', null, 'Title'),
                            message: gettextCatalog.getString('Before you can start sending and receiving emails from your new addresses you need to create encryption keys for them. 4096-bit keys only work on high performance computers. For most users, we recommend using 2048-bit keys.', null, 'Info'),
                            password: mailboxPassword,
                            addresses,
                            close(success) {
                                if (success) {
                                    /* eslint no-use-before-define: "off" */
                                    call();
                                    deferred.resolve();
                                } else {
                                    deferred.reject();
                                }

                                generateModal.deactivate();
                            }
                        }
                    });

                    return deferred.promise;
                };

                const storeKeys = (keys) => {
                    authentication.clearKeys();
                    _.each(keys, ({ address, key, pkg }) => {
                        authentication.storeKey(address.ID, key.ID, pkg);
                    });
                };

                const mergeUser = () => {
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
                };

                return organizationKeyPromise
                .then((organizationKey) => setupKeys.decryptUser(user, organizationKey, mailboxPassword))
                .then(({ keys, dirtyAddresses }) => {
                    if (dirtyAddresses.length && !generateModal.active()) {
                        return generateKeys(dirtyAddresses)
                        .then(() => {
                            throw new Error('Regenerate keys for addresses');
                        }, () => storeKeys(keys));
                    }
                    storeKeys(keys);
                })
                .then(mergeUser)
                .catch((error) => {
                    $exceptionHandler(error);
                    throw error;
                });
            }
            return Promise.resolve();
        }

        function manageMessageCounts(counts) {
            if (angular.isDefined(counts)) {
                const labelIDs = [
                    CONSTANTS.MAILBOX_IDENTIFIERS.inbox,
                    CONSTANTS.MAILBOX_IDENTIFIERS.allDrafts,
                    CONSTANTS.MAILBOX_IDENTIFIERS.drafts,
                    CONSTANTS.MAILBOX_IDENTIFIERS.allSent,
                    CONSTANTS.MAILBOX_IDENTIFIERS.sent,
                    CONSTANTS.MAILBOX_IDENTIFIERS.trash,
                    CONSTANTS.MAILBOX_IDENTIFIERS.spam,
                    CONSTANTS.MAILBOX_IDENTIFIERS.allmail,
                    CONSTANTS.MAILBOX_IDENTIFIERS.archive,
                    CONSTANTS.MAILBOX_IDENTIFIERS.starred
                ].concat(labelsModel.ids());

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
        }

        function manageConversationCounts(counts) {
            if (angular.isDefined(counts)) {
                const labelIDs = [
                    CONSTANTS.MAILBOX_IDENTIFIERS.inbox,
                    CONSTANTS.MAILBOX_IDENTIFIERS.allDrafts,
                    CONSTANTS.MAILBOX_IDENTIFIERS.drafts,
                    CONSTANTS.MAILBOX_IDENTIFIERS.allSent,
                    CONSTANTS.MAILBOX_IDENTIFIERS.sent,
                    CONSTANTS.MAILBOX_IDENTIFIERS.trash,
                    CONSTANTS.MAILBOX_IDENTIFIERS.spam,
                    CONSTANTS.MAILBOX_IDENTIFIERS.allmail,
                    CONSTANTS.MAILBOX_IDENTIFIERS.archive,
                    CONSTANTS.MAILBOX_IDENTIFIERS.starred
                ].concat(labelsModel.ids());

                _.each(labelIDs, (labelID) => {
                    const count = _.findWhere(counts, { LabelID: labelID });

                    if (angular.isDefined(count)) {
                        cacheCounters.updateConversation(count.LabelID, count.Total, count.Unread);
                    } else {
                        cacheCounters.updateConversation(labelID, 0, 0);
                    }
                });

            }
        }

        function manageThreadings(messages, conversations) {
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
        }

        function manageDesktopNotifications(messages = []) {
            if (messages.length) {
                const threadingIsOn = authentication.user.ViewMode === CONSTANTS.CONVERSATION_VIEW_MODE;
                _.each(messages, ({ Action, Message }) => {
                    if (Action === 1 && Message.IsRead === 0 && Message.LabelIDs.indexOf(CONSTANTS.MAILBOX_IDENTIFIERS.inbox) !== -1) {
                        const title = gettextCatalog.getString('New mail from', null, 'Info') + ' ' + Message.Sender.Name || Message.SenderAddress;

                        desktopNotifications.create(title, {
                            body: Message.Subject,
                            icon: '/assets/img/notification-badge.gif',
                            onClick() {
                                window.focus();

                                if (threadingIsOn) {
                                    return $state.go('secured.inbox.element', { id: Message.ConversationID, messageID: Message.ID });
                                }

                                $state.go('secured.inbox.element', { id: Message.ID });

                            }
                        });
                    }
                });
            }
        }

        function manageStorage(storage) {
            if (angular.isDefined(storage)) {
                authentication.user.UsedSpace = storage;
            }
        }

        function manageMembers(members) {
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
        }

        function manageDomains(domains) {
            if (angular.isDefined(domains)) {
                _.each(domains, (domain) => {
                    if (domain.Action === DELETE) {
                        $rootScope.$emit('deleteDomain', domain.ID);
                    } else if (domain.Action === CREATE) {
                        $rootScope.$emit('createDomain', domain.ID, domain.Domain);
                    } else if (domain.Action === UPDATE) {
                        $rootScope.$emit('updateDomain', domain.ID, domain.Domain);
                    }
                });
            }
        }

        function manageOrganization(organization) {
            if (angular.isDefined(organization)) {
                $rootScope.$emit('organizationChange', organization);
            }
        }

        function manageFilters(filters) {
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
        }

        function manageNotices(notices) {
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
        }

        function manage(data) {
            manageNotices(data.Notices);
            // Check if eventID is sent
            if (data.Error) {
                return Events.getLatestID()
                    .then((result) => {
                        manageID(result.data.EventID);
                    });
            } else if (data.Refresh === 1) {
                manageID(data.EventID);
                cache.reset();
                cachePages.clear();
                cacheCounters.reset();
                cache.callRefresh();
                cacheCounters.query();
                return authentication.fetchUserInfo()
                    .then(() => {
                        $rootScope.$broadcast('updateUser');
                        $rootScope.$broadcast('updateContacts');
                        labelsModel.refresh();
                    });
            } else if (data.Reload === 1) {
                $window.location.reload();
                return Promise.resolve();
            } else if (isDifferent(data.EventID)) {
                labelsModel.sync(data.Labels);
                manageContacts(data.Contacts);
                manageThreadings(data.Messages, data.Conversations);
                manageDesktopNotifications(data.Messages);
                manageMessageCounts(data.MessageCounts);
                manageConversationCounts(data.ConversationCounts);
                manageStorage(data.UsedSpace);
                manageDomains(data.Domains);
                manageMembers(data.Members);
                manageOrganization(data.Organization);
                manageFilters(data.Filters);
                manageID(data.EventID);
                manageActiveMessage(data);
                return manageUser(data.User);
            }
            if (data.More === 1) {
                return call();
            }
            return Promise.resolve();
        }

        function reset() {
            $timeout.cancel(MODEL.promiseCancel);
            closeNotifications();
            interval();
        }

        function interval() {
            return get()
                .then(({ data = {} } = {}) => {
                    // Check for force upgrade
                    if (data.Code === 5003) {
                        // Force upgrade, kill event loop
                        $timeout.cancel(MODEL.promiseCancel);
                    } else {
                        closeNotifications();
                        MODEL.index = 0;
                        setTimer();
                        MODEL.promiseCancel = $timeout(interval, MODEL.milliseconds);
                        manage(data);
                    }
                    AppModel.set('onLine', true);
                },
                () => {
                    if (angular.isDefined(MODEL.promiseCancel)) {
                        $timeout.cancel(MODEL.promiseCancel);
                        closeNotifications();
                        /* eslint operator-assignment: "off" */
                        if (MODEL.index < (FIBONACCI.length - 1)) {
                            MODEL.index++;
                        }
                        setTimer(MODEL.milliseconds * FIBONACCI[MODEL.index]);
                        MODEL.promiseCancel = $timeout(interval, MODEL.milliseconds, false);
                        MODEL.notification = notify({ templateUrl: 'templates/notifications/retry.tpl.html', duration: '0', onClick: reset });
                        AppModel.set('onLine', false);
                    }
                }
            );
        }

        function start() {
            if (!MODEL.promiseCancel) {
                MODEL.promiseCancel = $timeout(interval, 0, false);
            }
        }

        function call() {
            return get()
                .then(({ data = {} } = {}) => {
                    AppModel.set('onLine', true);

                    if (data.Code === 1000) {
                        if (MODEL.index) {
                            closeNotifications();
                            setTimer();
                            MODEL.promiseCancel = $timeout(interval, MODEL.milliseconds);
                        }
                        return manage(data);
                    }

                    throw new Error(data.Error || 'Error event manager');
                });
        }

        return { setEventID, start, call, stop };
    });

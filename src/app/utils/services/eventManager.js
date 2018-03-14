import _ from 'lodash';

/* @ngInject */
function eventManager(
    $cookies,
    $injector,
    $rootScope,
    $state,
    $timeout,
    AppModel,
    authentication,
    cachePages,
    CONSTANTS,
    desktopNotifications,
    Events,
    gettextCatalog,
    mailSettingsModel,
    notify,
    sanitize,
    subscriptionModel,
    userSettingsModel,
    vpnSettingsModel
) {
    const { CONVERSATION_VIEW_MODE, INTERVAL_EVENT_TIMER, MAILBOX_IDENTIFIERS, STATUS } = CONSTANTS;
    const FIBONACCI = [1, 1, 2, 3, 5, 8];
    const { inbox, allDrafts, drafts, allSent, sent, trash, spam, allmail, archive, starred } = MAILBOX_IDENTIFIERS;
    const { DELETE, CREATE, UPDATE } = STATUS;
    const dispatch = (type, data = {}) => $rootScope.$emit('app.event', { type, data });
    const MODEL = {
        index: 0,
        milliseconds: INTERVAL_EVENT_TIMER
    };
    const closeNotifications = () => MODEL.notification && MODEL.notification.close();
    const setTimer = (timer = INTERVAL_EVENT_TIMER) => (MODEL.milliseconds = timer);
    const manageID = (id = MODEL.ID) => (MODEL.ID = id);
    const setEventID = (ID) => manageID(ID);
    const stop = () => {
        $timeout.cancel(MODEL.promiseCancel);
        delete MODEL.promiseCancel;
    };
    const manageActiveMessage = ({ Messages = [] }) => Messages.length && dispatch('activeMessages', { messages: _.map(Messages, 'Message') });
    const manageSubscription = ({ Subscription: subscription }) => subscription && dispatch('subscription.event', { subscription });
    const manageAddresses = ({ Addresses = [] }) => Addresses.length && dispatch('addresses.event', { addresses: Addresses });

    /**
     * Clean contact datas
     * @param  {Object} contact
     * @return {Object}
     */
    function cleanContact(contact = {}) {
        contact.Name = sanitize.input(contact.Name);
        contact.Email = sanitize.input(contact.Email);
        return contact;
    }

    function handleError(error = {}) {
        const { data = {} } = error;

        if (data.Error) {
            return Events.getLatestID().then(({ data = {} }) => manageID(data.EventID));
        }

        throw error;
    }

    function get() {
        if (MODEL.ID) {
            return Events.get(MODEL.ID).catch(handleError);
        }
        return Events.getLatestID().catch(handleError);
    }

    const manageContacts = (events = []) => events.length && $rootScope.$emit('contacts', { type: 'contactEvents', data: { events } });

    function manageMailSettings(mailSettings) {
        if (angular.isDefined(mailSettings)) {
            mailSettingsModel.set('all', mailSettings);
        }
    }

    function manageUserSettings(userSettings) {
        if (angular.isDefined(userSettings)) {
            userSettingsModel.set('all', userSettings);
        }
    }

    function manageVpnSettings(vpnSettings) {
        if (angular.isDefined(vpnSettings)) {
            vpnSettingsModel.set('all', vpnSettings);
        }
    }

    function manageContactEmails(contactEmails = []) {
        contactEmails.forEach((contactEmail) => {
            const contactCleaned = cleanContact(contactEmail.ContactEmail);
            if (contactEmail.Action === DELETE) {
                $rootScope.$emit('deleteContactEmail', contactEmail.ID);
            } else if (contactEmail.Action === CREATE || contactEmail.Action === UPDATE) {
                $rootScope.$emit('updateContactEmail', contactEmail.ID, contactCleaned);
            }
        });
    }

    function manageMessageCounts(counts) {
        if (angular.isDefined(counts)) {
            const labelIDs = [inbox, allDrafts, drafts, allSent, sent, trash, spam, allmail, archive, starred].concat(
                $injector.get('labelsModel').ids()
            );

            _.each(labelIDs, (labelID) => {
                const count = _.find(counts, { LabelID: labelID });

                if (angular.isDefined(count)) {
                    $injector.get('cacheCounters').updateMessage(count.LabelID, count.Total, count.Unread);
                } else {
                    $injector.get('cacheCounters').updateMessage(labelID, 0, 0);
                }
            });

            $rootScope.$emit('messages.counter');
        }
    }

    function manageConversationCounts(counts) {
        if (angular.isDefined(counts)) {
            const labelIDs = [inbox, allDrafts, drafts, allSent, sent, trash, spam, allmail, archive, starred].concat(
                $injector.get('labelsModel').ids()
            );

            _.each(labelIDs, (labelID) => {
                const count = _.find(counts, { LabelID: labelID });

                if (angular.isDefined(count)) {
                    $injector.get('cacheCounters').updateConversation(count.LabelID, count.Total, count.Unread);
                } else {
                    $injector.get('cacheCounters').updateConversation(labelID, 0, 0);
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
            $injector.get('cache').events(events, true);
        }
    }

    function manageDesktopNotifications(messages = []) {
        if (messages.length) {
            const { ViewMode } = mailSettingsModel.get();
            const threadingIsOn = ViewMode === CONVERSATION_VIEW_MODE;
            const { all } = $injector.get('labelsModel').get('map');

            const filterNotify = ({ LabelIDs = [] }) => {
                return LabelIDs.map((ID) => all[ID] || {}).filter(({ Notify }) => Notify);
            };

            // @todo move them to the model itself
            // @todo rename constants to UPPERCASE
            all[inbox] = { Notify: 1, ID: inbox };
            all[starred] = { Notify: 1, ID: starred };

            _.each(messages, ({ Action, Message = {} }) => {
                const onlyNotify = filterNotify(Message);

                if (Action === 1 && Message.IsRead === 0 && onlyNotify.length) {
                    const [{ ID }] = onlyNotify;
                    const route = `secured.${MAILBOX_IDENTIFIERS[ID] || 'label'}.element`;
                    const label = MAILBOX_IDENTIFIERS[ID] ? null : ID;
                    const title = gettextCatalog.getString(
                        'New mail from {{sender}}',
                        {
                            sender: Message.Sender.Name || Message.Sender.Address
                        },
                        'Notification user'
                    );

                    desktopNotifications.create(title, {
                        body: Message.Subject,
                        icon: '/assets/img/notification-badge.gif',
                        onClick() {
                            window.focus();

                            if (threadingIsOn) {
                                return $state.go(route, { id: Message.ConversationID, messageID: Message.ID, label });
                            }

                            $state.go(route, { id: Message.ID, label });
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
        members && dispatch('members', members);
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
        organization && $injector.get('organizationModel').set(organization);
    }

    function manageFilters(filters) {
        if (angular.isArray(filters)) {
            _.each(filters, (filter) => {
                if (filter.Action === DELETE) {
                    $rootScope.$broadcast('deleteFilter', filter.ID);
                } else if (filter.Action === CREATE) {
                    const simple = Sieve.fromTree(filter.Filter.Tree);
                    if (_.isEqual(filter.Filter.Tree, Sieve.toTree(simple))) {
                        filter.Filter.Simple = simple;
                    } else {
                        delete filter.Filter.Simple;
                    }
                    $rootScope.$broadcast('createFilter', filter.ID, filter.Filter);
                } else if (filter.Action === UPDATE) {
                    const simple = Sieve.fromTree(filter.Filter.Tree);
                    if (_.isEqual(filter.Filter.Tree, Sieve.toTree(simple))) {
                        filter.Filter.Simple = simple;
                    } else {
                        delete filter.Filter.Simple;
                    }
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
                        templateUrl: require('../../../templates/notifications/cross.tpl.html'),
                        duration: '0',
                        onClose: onClose(cookieName)
                    });
                }
            }
        }
    }

    function refreshMail() {
        $injector.get('cache').reset();
        cachePages.clear();
        $injector.get('cacheCounters').reset();
        $injector.get('cache').callRefresh();
        $injector.get('cacheCounters').query();

        return authentication.fetchUserInfo().then(() => {
            $rootScope.$broadcast('updateUser');
            $injector.get('labelsModel').refresh();
        });
    }

    function refreshContact() {
        $rootScope.$emit('resetContactEmails');
        $rootScope.$emit('contacts', { type: 'resetContacts' });
    }

    function manage(data) {
        manageNotices(data.Notices);
        manageID(data.EventID);

        if (data.Refresh) {
            data.Refresh & 1 && refreshMail();
            data.Refresh & 2 && refreshContact();
            return Promise.resolve();
        }

        $injector.get('labelsModel').sync(data.Labels);
        manageMailSettings(data.MailSettings);
        manageVpnSettings(data.VPNSettings);
        manageUserSettings(data.UserSettings);
        manageSubscription(data);
        manageContactEmails(data.ContactEmails);
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
        manageActiveMessage(data);
        manageAddresses(data);

        return $injector.get('manageUser')(data)
            .then(() => {
                if (data.More === 1) {
                    return call();
                }
            });
    }

    function reset() {
        $timeout.cancel(MODEL.promiseCancel);
        closeNotifications();
        interval();
    }

    function interval() {
        return get().then(
            ({ data = {} } = {}) => {
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
                    if (MODEL.index < FIBONACCI.length - 1) {
                        MODEL.index++;
                    }
                    setTimer(MODEL.milliseconds * FIBONACCI[MODEL.index]);
                    MODEL.promiseCancel = $timeout(interval, MODEL.milliseconds, false);
                    MODEL.notification = notify({
                        templateUrl: require('../../../templates/notifications/retry.tpl.html'),
                        duration: '0',
                        onClick: reset
                    });
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

                if (MODEL.index) {
                    closeNotifications();
                    setTimer();
                    MODEL.promiseCancel = $timeout(interval, MODEL.milliseconds);
                }

                return manage(data);
            })
            .catch(({ data = {} } = {}) => {
                throw new Error(data.Error || 'Error event manager');
            });
    }

    return { setEventID, start, call, stop };
}
export default eventManager;

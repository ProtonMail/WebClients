import _ from 'lodash';

import { CONVERSATION_VIEW_MODE, INTERVAL_EVENT_TIMER, MAILBOX_IDENTIFIERS, STATUS } from '../../constants';

/* @ngInject */
function eventManager(
    $cookies,
    $injector,
    $state,
    $timeout,
    AppModel,
    authentication,
    cachePages,
    desktopNotifications,
    dispatchers,
    Events,
    gettextCatalog,
    mailSettingsModel,
    notify,
    userSettingsModel
) {
    const FIBONACCI = [1, 1, 2, 3, 5, 8];
    const { inbox, allDrafts, drafts, allSent, sent, trash, spam, allmail, archive, starred } = MAILBOX_IDENTIFIERS;
    const { DELETE, CREATE, UPDATE } = STATUS;
    const { dispatcher } = dispatchers([
        'app.event',
        'contacts',
        'messages.counter',
        'resetContactEmails',
        'filter',
        'updateUser'
    ]);
    const dispatch = (type, data = {}) => dispatcher['app.event'](type, data);
    const MODEL = {
        index: 0,
        milliseconds: INTERVAL_EVENT_TIMER
    };
    const CACHE = {};
    const closeNotifications = () => MODEL.notification && MODEL.notification.close();
    const setTimer = (timer = INTERVAL_EVENT_TIMER) => (MODEL.milliseconds = timer);
    const manageID = (id = MODEL.ID) => (MODEL.ID = id);
    const setEventID = (ID) => manageID(ID);
    const stop = () => {
        $timeout.cancel(MODEL.promiseCancel);
        delete MODEL.promiseCancel;
    };
    const manageActiveMessage = ({ Messages = [] }) =>
        Messages.length && dispatch('activeMessages', { messages: _.map(Messages, 'Message') });
    const manageSubscription = ({ Subscription: subscription }) =>
        subscription && dispatch('subscription.event', { subscription });

    function handleError(error = {}) {
        const { data = {} } = error;

        if (data.Error) {
            return Events.getLatestID().then(({ data = {} }) => {
                manageID(data.EventID);
            });
        }

        throw error;
    }

    /**
     * Gets the next event depending on the current state. If the next event is already being fetched, return
     * the cached promise that is fetching the next event.
     * @returns {*}
     */
    function get() {
        if (MODEL.ID && CACHE[MODEL.ID]) {
            return CACHE[MODEL.ID];
        }
        if (MODEL.ID) {
            // Do some caching: otherwise importing 5000 vcards chokes the eventManager
            // make id immutable
            const id = MODEL.ID;
            CACHE[id] = Events.get(id)
                .catch(handleError)
                .then(
                    (data) => {
                        delete CACHE[id];
                        return data;
                    },
                    (error) => {
                        delete CACHE[id];
                        throw error;
                    }
                );

            return CACHE[id];
        }
        return Events.getLatestID().catch(handleError);
    }

    const manageContacts = (events = []) => events.length && dispatcher.contacts('contactEvents', { events });

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
            $injector.get('vpnSettingsModel').set('all', vpnSettings);
        }
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

            dispatcher['messages.counter']();
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
            const states = Object.keys(MAILBOX_IDENTIFIERS).reduce((acc, state) => {
                acc[MAILBOX_IDENTIFIERS[state]] = state;
                return acc;
            }, {});

            const filterNotify = ({ LabelIDs = [] }) => {
                return LabelIDs.map((ID) => all[ID] || {}).filter(({ Notify }) => Notify);
            };

            // @todo move them to the model itself
            // @todo rename constants to UPPERCASE
            all[inbox] = { Notify: 1, ID: inbox };
            all[starred] = { Notify: 1, ID: starred };

            const now = moment();

            _.each(messages, ({ Action, Message = {} }) => {
                const mTime = moment.unix(Message.Time);
                const onlyNotify = filterNotify(Message);

                if (Action === 1 && Message.Unread === 1 && onlyNotify.length && mTime.isSame(now, 'day')) {
                    const [{ ID }] = onlyNotify;
                    const route = `secured.${states[ID] || 'label'}.element`;
                    const label = states[ID] ? null : ID;
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

    function manageMembers(members = []) {
        members.length && dispatch('members', members);
    }

    function manageDomains(domains = []) {
        domains.length && dispatch('domains', domains);
    }

    function manageOrganization(organization) {
        organization && $injector.get('organizationModel').set(organization);
    }

    function manageFilters(filters) {
        if (angular.isArray(filters)) {
            _.each(filters, (filter) => {
                if (filter.Action === DELETE) {
                    dispatcher.filter('delete', { ID: filter.ID });
                } else if (filter.Action === CREATE) {
                    const simple = Sieve.fromTree(filter.Filter.Tree);
                    if (_.isEqual(filter.Filter.Tree, Sieve.toTree(simple))) {
                        filter.Filter.Simple = simple;
                    } else {
                        delete filter.Filter.Simple;
                    }
                    dispatcher.filter('create', { ID: filter.ID, Filter: filter.Filter });
                } else if (filter.Action === UPDATE) {
                    const simple = Sieve.fromTree(filter.Filter.Tree);
                    if (_.isEqual(filter.Filter.Tree, Sieve.toTree(simple))) {
                        filter.Filter.Simple = simple;
                    } else {
                        delete filter.Filter.Simple;
                    }
                    dispatcher.filter('update', { ID: filter.ID, Filter: filter.Filter });
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
                const cookieName =
                    'NOTICE-' + openpgp.util.hexidump(openpgp.crypto.hash.md5(openpgp.util.str2Uint8Array(message)));

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
            dispatcher.updateUser();
            $injector.get('labelsModel').refresh();
        });
    }

    function refreshContact() {
        dispatcher.resetContactEmails();
        dispatcher.contacts('resetContacts');
    }

    const manage = async (data) => {
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
        $injector.get('contactEmails').update(data.ContactEmails);
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
        await $injector.get('addressesModel').update(data.Addresses);
        await $injector.get('manageUser')(data);

        if (data.More === 1) {
            return call();
        }
    };

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

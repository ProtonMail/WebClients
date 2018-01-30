import _ from 'lodash';

import { flow, filter, each } from 'lodash/fp';
import { MOUSETRAP_KEY_EVENT } from '../../constants';

/* @ngInject */
function hotkeys(hotkeyModal, $rootScope, $state, authentication, $injector, gettextCatalog) {
    const I18N = {
        OPEN_COMPOSER: gettextCatalog.getString('Open the composer', null, 'Hotkey description'),
        CREATE_REPLY: gettextCatalog.getString('Create a reply', null, 'Hotkey description'),
        CREATE_REPLY_ALL: gettextCatalog.getString('Create a reply all', null, 'Hotkey description'),
        FORWARD_MSG: gettextCatalog.getString('Forward the message', null, 'Hotkey description'),
        MARK_AS_READ: gettextCatalog.getString('Mark as read', null, 'Hotkey description'),
        MARK_AS_UNREAD: gettextCatalog.getString('Mark as unread', null, 'Hotkey description'),
        MOVE_TO_INBOX: gettextCatalog.getString('Move to inbox', null, 'Hotkey description'),
        MOVE_TO_TRASH: gettextCatalog.getString('Move to trash', null, 'Hotkey description'),
        MOVE_TO_ARCHIVE: gettextCatalog.getString('Move to archive', null, 'Hotkey description'),
        MOVE_TO_SPAM: gettextCatalog.getString('Move to spam', null, 'Hotkey description'),
        SHOW_HOTKEYS_LIST: gettextCatalog.getString('Show hotkeys available', null, 'Hotkey description'),
        GO_TO_INBOX: gettextCatalog.getString('Go to inbox', null, 'Hotkey description'),
        GO_TO_DRAFTS: gettextCatalog.getString('Go to drafts', null, 'Hotkey description'),
        GO_TO_SENT: gettextCatalog.getString('Go to sent', null, 'Hotkey description'),
        GO_TO_STARRED: gettextCatalog.getString('Go to starred', null, 'Hotkey description'),
        GO_TO_ARCHIVE: gettextCatalog.getString('Go to archive', null, 'Hotkey description'),
        GO_TO_SPAM: gettextCatalog.getString('Go to spam', null, 'Hotkey description'),
        GO_TO_TRASH: gettextCatalog.getString('Go to trash', null, 'Hotkey description'),
        SELECT_ALL: gettextCatalog.getString('Select all elements', null, 'Hotkey description'),
        UNSELECT_ALL: gettextCatalog.getString('Unselect all elements', null, 'Hotkey description')
    };

    const action = (cb) => () => (cb(), false);
    const redirect = (state) => () => $state.go(state);
    const emit = (action, data = {}) => () => {
        if (action === 'composer.new') {
            data.data.message = $injector.get('messageModel')();
        }
        $rootScope.$emit(action, data);
    };
    const broadcast = (action, data = {}) => () => $rootScope.$broadcast(action, data);

    const openMarked = (event) => {
        $rootScope.$broadcast('openMarked');

        // This function is bind to the Enter key, we need to prevent the
        // browser from executing the default action otherwise it will
        // trigger a click on the currently focused element.
        event.preventDefault();
    };

    const help = () => {
        hotkeyModal.activate({
            params: {
                close() {
                    hotkeyModal.deactivate();
                }
            }
        });

        return false;
    };

    const goToInbox = action(redirect('secured.inbox'));
    const goToDrafts = action(redirect('secured.drafts'));
    const goToSent = action(redirect('secured.sent'));
    const goToStarred = action(redirect('secured.starred'));
    const goToArchive = action(redirect('secured.archive'));
    const goToSpam = action(redirect('secured.spam'));
    const goToTrash = action(redirect('secured.trash'));

    const composer = action(
        emit('composer.create', {
            type: 'new',
            data: {}
        })
    );

    const commandPalette = action(emit('hotkeys', { type: 'commandPalette' }));
    const composerSave = action(emit('composer.update', { type: 'key.autosave' }));
    const reply = action(emit('replyConversation'));
    const replyAll = action(emit('replyAllConversation'));
    const forward = action(emit('forwardConversation'));
    const selectAll = action(emit('selectElements', { value: 'all', isChecked: true }));
    const unselectAll = action(emit('selectElements', { value: 'all', isChecked: false }));
    const slash = action(emit('hotkeys', { type: 'slash' }));
    const toggleStar = action(emit('toggleStar'));

    const selectMark = action(broadcast('selectMark'));
    const markPrevious = action(broadcast('markPrevious'));
    const markNext = action(broadcast('markNext'));
    const escape = action(emit('hotkeys', { type: 'escape' }));
    // const escape = action(broadcast('escape'));
    const left = action(broadcast('left'));
    const right = action(broadcast('right'));
    const read = action(broadcast('read'));
    const unread = action(broadcast('unread'));
    const inbox = action(broadcast('move', 'inbox'));
    const trash = action(broadcast('move', 'trash'));
    const archive = action(broadcast('move', 'archive'));
    const spam = action(broadcast('move', 'spam'));
    const nextElement = action(broadcast('nextElement'));
    const previousElement = action(broadcast('previousElement'));

    const keys = [
        {
            keyboard: 'c',
            callback: composer,
            description: I18N.OPEN_COMPOSER
        },
        { keyboard: 'meta+s', callback: composerSave },
        { keyboard: 'shift+space', callback: commandPalette },
        {
            keyboard: 'shift+r',
            callback: reply,
            description: I18N.CREATE_REPLY
        },
        {
            keyboard: 'shift+a',
            callback: replyAll,
            description: I18N.CREATE_REPLY_ALL
        },
        {
            keyboard: 'shift+f',
            callback: forward,
            description: I18N.FORWARD_MSG
        },
        { keyboard: 'k', callback: previousElement },
        { keyboard: 'j', callback: nextElement },
        { keyboard: 'enter', callback: openMarked },
        {
            keyboard: 'r',
            callback: read,
            description: I18N.MARK_AS_READ
        },
        {
            keyboard: 'u',
            callback: unread,
            description: I18N.MARK_AS_UNREAD
        },
        { keyboard: '.', callback: toggleStar },
        {
            keyboard: 'i',
            callback: inbox,
            description: I18N.MOVE_TO_INBOX
        },
        {
            keyboard: ['t', 'del'],
            callback: trash,
            description: I18N.MOVE_TO_TRASH
        },
        {
            keyboard: 'a',
            callback: archive,
            description: I18N.MOVE_TO_ARCHIVE
        },
        {
            keyboard: 's',
            callback: spam,
            description: I18N.MOVE_TO_SPAM
        },
        {
            keyboard: '?',
            callback: help,
            description: I18N.SHOW_HOTKEYS_LIST
        },
        {
            keyboard: 'g i',
            callback: goToInbox,
            description: I18N.GO_TO_INBOX
        },
        {
            keyboard: 'g d',
            callback: goToDrafts,
            description: I18N.GO_TO_DRAFTS
        },
        {
            keyboard: 'g s',
            callback: goToSent,
            description: I18N.GO_TO_SENT
        },
        {
            keyboard: 'g .',
            callback: goToStarred,
            description: I18N.GO_TO_STARRED
        },
        {
            keyboard: 'g a',
            callback: goToArchive,
            description: I18N.GO_TO_ARCHIVE
        },
        {
            keyboard: 'g x',
            callback: goToSpam,
            description: I18N.GO_TO_SPAM
        },
        {
            keyboard: 'g t',
            callback: goToTrash,
            description: I18N.GO_TO_TRASH
        },
        {
            keyboard: '* a',
            callback: selectAll,
            description: I18N.SELECT_ALL
        },
        {
            keyboard: '* n',
            callback: unselectAll,
            description: I18N.UNSELECT_ALL
        },
        { keyboard: 'x', callback: selectMark },
        { keyboard: 'left', callback: left },
        { keyboard: 'right', callback: right },
        { keyboard: 'up', callback: markPrevious },
        { keyboard: 'down', callback: markNext },
        { keyboard: 'escape', callback: escape },
        { keyboard: '/', callback: slash }
    ];

    const removeBinding = ({ keyboard }) => Mousetrap.unbind(keyboard);
    const addBinding = ({ keyboard, callback }) => Mousetrap.bind(keyboard, callback, MOUSETRAP_KEY_EVENT);
    /**
     * Bind/unBind an action for an event based on a custom list
     * @param  {Array}    list [...<eventName>]
     * @param  {Function} cb   Action to perform
     * @return {void}
     */
    const filterBinding = (list = [], cb = angular.noop) => {
        flow(filter(({ keyboard }) => _.includes(list, keyboard)), each(cb))(keys);
    };

    const hotkeys = {
        trigger: Mousetrap.trigger,
        bind(list = []) {
            if (!list.length) {
                return keys.forEach(addBinding);
            }

            filterBinding(list, addBinding);
        },
        unbind(list = []) {
            if (!list.length) {
                // NOTE Mousetrap.unbind doesn't seem to work
                return Mousetrap.reset();
            }

            filterBinding(list, removeBinding);
        },
        pause() {
            Mousetrap.pause();
        },
        unpause() {
            Mousetrap.unpause();
        },
        keys() {
            return angular.copy(keys);
        },
        translations(key) {
            return I18N[key] || I18N;
        }
    };

    return hotkeys;
}

export default hotkeys;

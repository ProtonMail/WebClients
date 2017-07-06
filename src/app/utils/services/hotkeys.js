angular.module('proton.utils')
.factory('hotkeys', (hotkeyModal, $rootScope, $state, authentication, CONSTANTS, messageModel) => {

    const action = (cb) => () => (cb(), false);
    const redirect = (state) => () => $state.go(state);
    const emit = (action, data = {}) => () => $rootScope.$emit(action, data);
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

    const composer = action(emit('composer.new', { message: messageModel(), type: 'new' }));
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
    const escape = action(broadcast('escape'));
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
        { keyboard: 'c', callback: composer },
        { keyboard: 'meta+s', callback: composerSave },
        { keyboard: 'shift+r', callback: reply },
        { keyboard: 'shift+a', callback: replyAll },
        { keyboard: 'shift+f', callback: forward },
        { keyboard: 'k', callback: nextElement },
        { keyboard: 'j', callback: previousElement },
        { keyboard: 'enter', callback: openMarked },
        { keyboard: 'r', callback: read },
        { keyboard: 'u', callback: unread },
        { keyboard: '.', callback: toggleStar },
        { keyboard: 'i', callback: inbox },
        { keyboard: ['t', 'del'], callback: trash },
        { keyboard: 'a', callback: archive },
        { keyboard: 's', callback: spam },
        { keyboard: '?', callback: help },
        { keyboard: 'g i', callback: goToInbox },
        { keyboard: 'g d', callback: goToDrafts },
        { keyboard: 'g s', callback: goToSent },
        { keyboard: 'g .', callback: goToStarred },
        { keyboard: 'g a', callback: goToArchive },
        { keyboard: 'g x', callback: goToSpam },
        { keyboard: 'g t', callback: goToTrash },
        { keyboard: '* a', callback: selectAll },
        { keyboard: '* n', callback: unselectAll },
        { keyboard: 'x', callback: selectMark },
        { keyboard: 'left', callback: left },
        { keyboard: 'right', callback: right },
        { keyboard: 'up', callback: markPrevious },
        { keyboard: 'down', callback: markNext },
        { keyboard: 'escape', callback: escape },
        { keyboard: '/', callback: slash }
    ];

    const removeBinding = ({ keyboard }) => Mousetrap.unbind(keyboard);
    const addBinding = ({ keyboard, callback }) => Mousetrap.bind(keyboard, callback);
    /**
     * Bind/unBind an action for an event based on a custom list
     * @param  {Array}    list [...<eventName>]
     * @param  {Function} cb   Action to perform
     * @return {void}
     */
    const filterBinding = (list = [], cb = angular.noop) => {
        _.chain(keys)
            .filter(({ keyboard }) => _.contains(list, keyboard))
            .each(cb);
    };

    const hotkeys = {
        bind(list = []) {
            if (!list.length) {
                return keys.forEach(addBinding);
            }

            filterBinding(list, addBinding);
        },
        unbind(list = []) {
            if (!list.length) {
                return keys.forEach(removeBinding);
            }

            filterBinding(list, removeBinding);
        }
    };

    return hotkeys;
});

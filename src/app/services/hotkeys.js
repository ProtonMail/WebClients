angular.module('proton.hotkeys', [])
.factory('hotkeys', (hotkeyModal, $rootScope, $state, authentication, CONSTANTS, Message) => {
    const composer = () => {
        const type = 'new';
        const message = new Message();

        $rootScope.$emit('composer.new', { message, type });

        return false;
    };


    const reply = function () {
        $rootScope.$emit('replyConversation');

        return false;
    };


    const replyAll = function () {
        $rootScope.$emit('replyAllConversation');

        return false;
    };


    const forward = function () {
        $rootScope.$emit('forwardConversation');

        return false;
    };

    const nextElement = () => {
        $rootScope.$broadcast('nextElement');

        return false;
    };

    const previousElement = () => {
        $rootScope.$broadcast('previousElement');

        return false;
    };

    const openMarked = (event) => {
        $rootScope.$broadcast('openMarked');

        // This function is bind to the Enter key, we need to prevent the
        // browser from executing the default action otherwise it will
        // trigger a click on the currently focused element.
        event.preventDefault();
    };

    const read = () => {
        $rootScope.$broadcast('read');

        return false;
    };

    const unread = () => {
        $rootScope.$broadcast('unread');

        return false;
    };

    const toggleStar = () => {
        $rootScope.$broadcast('toggleStar');

        return false;
    };

    const inbox = () => {
        $rootScope.$broadcast('move', 'inbox');

        return false;
    };

    const trash = () => {
        $rootScope.$broadcast('move', 'trash');

        return false;
    };

    const archive = () => {
        $rootScope.$broadcast('move', 'archive');

        return false;
    };

    const spam = () => {
        $rootScope.$broadcast('move', 'spam');

        return false;
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

    const goToInbox = () => {
        $state.go('secured.inbox');

        return false;
    };

    const goToDrafts = () => {
        $state.go('secured.drafts');

        return false;
    };

    const goToSent = () => {
        $state.go('secured.sent');

        return false;
    };

    const goToStarred = () => {
        $state.go('secured.starred');

        return false;
    };

    const goToArchive = () => {
        $state.go('secured.archive');

        return false;
    };

    const goToSpam = () => {
        $state.go('secured.spam');

        return false;
    };

    const goToTrash = () => {
        $state.go('secured.trash');

        return false;
    };

    const selectAll = () => {
        $rootScope.$broadcast('selectAllElements');

        return false;
    };

    const unselectAll = () => {
        $rootScope.$broadcast('unselectAllElements');

        return false;
    };

    const selectMark = () => {
        $rootScope.$broadcast('selectMark');

        return false;
    };

    const markPrevious = () => {
        $rootScope.$broadcast('markPrevious');

        return false;
    };

    const markNext = () => {
        $rootScope.$broadcast('markNext');

        return false;
    };

    const escape = () => {
        $rootScope.$broadcast('escape');

        return false;
    };

    const left = () => {
        $rootScope.$broadcast('left');

        return false;
    };

    const right = () => {
        $rootScope.$broadcast('right');

        return false;
    };

    const slash = () => {
        const inputs = angular.element('.query');

        inputs[0].focus();

        return false;
    };

    const keys = [
        { keyboard: 'c', callback: composer },
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

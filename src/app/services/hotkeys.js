angular.module('proton.hotkeys', [])
.factory('hotkeys', (hotkeyModal, $rootScope, $state, authentication, CONSTANTS, Message) => {
    const composer = (event) => {
        const type = 'new';
        const message = new Message();

        $rootScope.$emit('composer.new', {message, type});

        return false;
    };


    const reply = function(event) {
        $rootScope.$emit('replyConversation');

        return false;
    };


    const replyAll = function(event) {
        $rootScope.$emit('replyAllConversation');

        return false;
    };


    const forward = function(event) {
        $rootScope.$emit('forwardConversation');

        return false;
    };

    const nextElement = (event) => {
        $rootScope.$broadcast('nextElement');

        return false;
    };

    const previousElement = (event) => {
        $rootScope.$broadcast('previousElement');

        return false;
    };

    const openMarked = (event) => {
        $rootScope.$broadcast('openMarked');
    };

    const read = (event) => {
        $rootScope.$broadcast('read');

        return false;
    };

    const unread = (event) => {
        $rootScope.$broadcast('unread');

        return false;
    };

    const toggleStar = (event) => {
        $rootScope.$broadcast('toggleStar');

        return false;
    };

    const inbox = (event) => {
        $rootScope.$broadcast('move', 'inbox');

        return false;
    };

    const trash = (event) => {
        $rootScope.$broadcast('move', 'trash');

        return false;
    };

    const archive = (event) => {
        $rootScope.$broadcast('move', 'archive');

        return false;
    };

    const spam = (event) => {
        $rootScope.$broadcast('move', 'spam');

        return false;
    };

    const help = (event) => {
        hotkeyModal.activate({
            params: {
                close: function() {
                    hotkeyModal.deactivate();
                }
            }
        });

        return false;
    };

    const goToInbox = (event) => {
        $state.go('secured.inbox');

        return false;
    };

    const goToDrafts = (event) => {
        $state.go('secured.drafts');

        return false;
    };

    const goToSent = (event) => {
        $state.go('secured.sent');

        return false;
    };

    const goToStarred = (event) => {
        $state.go('secured.starred');

        return false;
    };

    const goToArchive = (event) => {
        $state.go('secured.archive');

        return false;
    };

    const goToSpam = (event) => {
        $state.go('secured.spam');

        return false;
    };

    const goToTrash = (event) => {
        $state.go('secured.trash');

        return false;
    };

    const selectAll = (event) => {
        $rootScope.$broadcast('selectAllElements');

        return false;
    };

    const unselectAll = (event) => {
        $rootScope.$broadcast('unselectAllElements');

        return false;
    };

    const selectMark = (event) => {
        $rootScope.$broadcast('selectMark');

        return false;
    };

    const markPrevious = (event) => {
        $rootScope.$broadcast('markPrevious');

        return false;
    };

    const markNext = (event) => {
        $rootScope.$broadcast('markNext');

        return false;
    };

    const escape = (event) => {
        $rootScope.$broadcast('escape');

        return false;
    };

    const left = (event) => {
        $rootScope.$broadcast('left');

        return false;
    };

    const right = (event) => {
        $rootScope.$broadcast('right');

        return false;
    };

    const slash = (event) => {
        const inputs = angular.element('.query');

        inputs[0].focus();

        return false;
    };

    const keys = [
        {keyboard: 'c', callback: composer},
        {keyboard: 'shift+r', callback: reply},
        {keyboard: 'shift+a', callback: replyAll},
        {keyboard: 'shift+f', callback: forward},
        {keyboard: 'k', callback: nextElement},
        {keyboard: 'j', callback: previousElement},
        {keyboard: 'enter', callback: openMarked},
        {keyboard: 'r', callback: read},
        {keyboard: 'u', callback: unread},
        {keyboard: '.', callback: toggleStar},
        {keyboard: 'i', callback: inbox},
        {keyboard: ['t', 'del'], callback: trash},
        {keyboard: 'a', callback: archive},
        {keyboard: 's', callback: spam},
        {keyboard: '?', callback: help},
        {keyboard: 'g i', callback: goToInbox},
        {keyboard: 'g d', callback: goToDrafts},
        {keyboard: 'g s', callback: goToSent},
        {keyboard: 'g .', callback: goToStarred},
        {keyboard: 'g a', callback: goToArchive},
        {keyboard: 'g x', callback: goToSpam},
        {keyboard: 'g t', callback: goToTrash},
        {keyboard: '* a', callback: selectAll},
        {keyboard: '* n', callback: unselectAll},
        {keyboard: 'x', callback: selectMark},
        {keyboard: 'left', callback: left},
        {keyboard: 'right', callback: right},
        {keyboard: 'up', callback: markPrevious},
        {keyboard: 'down', callback: markNext},
        {keyboard: 'escape', callback: escape},
        {keyboard: '/', callback: slash}
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

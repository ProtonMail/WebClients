angular.module('proton.hotkeys', [])
.factory('hotkeys', (hotkeyModal, $rootScope, $state, authentication, CONSTANTS, messageBuilder) => {
    const composer = (event) => {
        $rootScope.$emit('newMessage', messageBuilder.create('new'));

        return false;
    };

    const reply = (event) => {
        $rootScope.$broadcast('replyConversation');

        return false;
    };

    const replyAll = (event) => {
        $rootScope.$broadcast('replyAllConversation');

        return false;
    };

    const forward = (event) => {
        $rootScope.$broadcast('forwardConversation');

        return false;
    };

    const nextConversation = (event) => {
        $rootScope.$broadcast('nextConversation');

        return false;
    };

    const previousConversation = (event) => {
        $rootScope.$broadcast('previousConversation');

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
        {keyboard: 'k', callback: nextConversation},
        {keyboard: 'j', callback: previousConversation},
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

    const hotkeys = {
        bind() {
            keys.forEach(({keyboard, callback}) => {
                Mousetrap.bind(keyboard, callback);
            });
        },
        unbind() {
            keys.forEach(({keyboard, callback}) => {
                Mousetrap.unbind(keyboard, callback);
            });
        }
    };

    return hotkeys;
});

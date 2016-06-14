angular.module('proton.hotkeys', [])
.factory('hotkeys', function(hotkeyModal, $rootScope, $state, authentication, CONSTANTS) {
    var composer = function(event) {
        $rootScope.$broadcast('newMessage');

        return false;
    };

    var reply = function(event) {
        $rootScope.$broadcast('replyConversation');

        return false;
    };

    var replyAll = function(event) {
        $rootScope.$broadcast('replyAllConversation');

        return false;
    };

    var forward = function(event) {
        $rootScope.$broadcast('forwardConversation');

        return false;
    };

    var nextConversation = function(event) {
        $rootScope.$broadcast('nextConversation');

        return false;
    };

    var previousConversation = function(event) {
        $rootScope.$broadcast('previousConversation');

        return false;
    };

    var openMarked = function(event) {
        $rootScope.$broadcast('openMarked');
    };

    var nextMessage = function(event) {
        $rootScope.$broadcast('nextMessage');

        return false;
    };

    var previousMessage = function(event) {
        $rootScope.$broadcast('previousMessage');

        return false;
    };

    var read = function(event) {
        $rootScope.$broadcast('read');

        return false;
    };

    var unread = function(event) {
        $rootScope.$broadcast('unread');

        return false;
    };

    var toggleStar = function(event) {
        $rootScope.$broadcast('toggleStar');

        return false;
    };

    var inbox = function(event) {
        $rootScope.$broadcast('move', 'inbox');

        return false;
    };

    var trash = function(event) {
        $rootScope.$broadcast('move', 'trash');

        return false;
    };

    var archive = function(event) {
        $rootScope.$broadcast('move', 'archive');

        return false;
    };

    var spam = function(event) {
        $rootScope.$broadcast('move', 'spam');

        return false;
    };

    var help = function(event) {
        hotkeyModal.activate({
            params: {
                close: function() {
                    hotkeyModal.deactivate();
                }
            }
        });

        return false;
    };

    var goToInbox = function(event) {
        $state.go('secured.inbox');

        return false;
    };

    var goToDrafts = function(event) {
        $state.go('secured.drafts');

        return false;
    };

    var goToSent = function(event) {
        $state.go('secured.sent');

        return false;
    };

    var goToStarred = function(event) {
        $state.go('secured.starred');

        return false;
    };

    var goToArchive = function(event) {
        $state.go('secured.archive');

        return false;
    };

    var goToSpam = function(event) {
        $state.go('secured.spam');

        return false;
    };

    var goToTrash = function(event) {
        $state.go('secured.trash');

        return false;
    };

    var selectAll = function(event) {
        $rootScope.$broadcast('selectAllElements');

        return false;
    };

    var unselectAll = function(event) {
        $rootScope.$broadcast('unselectAllElements');

        return false;
    };

    var selectMark = function(event) {
        $rootScope.$broadcast('selectMark');

        return false;
    };

    var markPrevious = function(event) {
        $rootScope.$broadcast('markPrevious');

        return false;
    };

    var markNext = function(event) {
        $rootScope.$broadcast('markNext');

        return false;
    };

    var escape = function(event) {
        $rootScope.$broadcast('escape');

        return false;
    };

    var slash = function(event) {
        var inputs = angular.element('.query');

        inputs[0].focus();

        return false;
    };

    var keys = [
        {keyboard: 'c', callback: composer},
        {keyboard: 'shift+r', callback: reply},
        {keyboard: 'shift+a', callback: replyAll},
        {keyboard: 'shift+f', callback: forward},
        {keyboard: 'k', callback: nextConversation},
        {keyboard: 'j', callback: previousConversation},
        {keyboard: 'enter', callback: openMarked},
        {keyboard: 'p', callback: previousMessage},
        {keyboard: 'n', callback: nextMessage},
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
        {keyboard: 'up', callback: markPrevious},
        {keyboard: 'down', callback: markNext},
        {keyboard: 'escape', callback: escape},
        {keyboard: '/', callback: slash}
    ];

    var hotkeys = {
        bind: function() {
            _.each(keys, function(key) {
                Mousetrap.bind(key.keyboard, key.callback);
            });
        },
        unbind: function() {
            _.each(keys, function(key) {
                Mousetrap.unbind(key.keyboard);
            });
        }
    };

    return hotkeys;
});

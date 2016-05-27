angular.module('proton.hotkeys', [])
.factory('hotkeys', function(hotkeyModal, $rootScope, authentication) {
    var ROW_MODE = 1;
    var COLUMN_MODE = 0;

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

    var left = function(event) {
        if (authentication.user.ViewLayout === ROW_MODE) {
            $rootScope.$broadcast('nextConversation');

            return false;
        }
    };

    var right = function(event) {
        if (authentication.user.ViewLayout === ROW_MODE) {
            $rootScope.$broadcast('previousConversation');

            return false;
        }
    };

    var up = function(event) {
        if (authentication.user.ViewLayout === COLUMN_MODE) {
            $rootScope.$broadcast('nextConversation');

            return false;
        }
    };

    var down = function(event) {
        if (authentication.user.ViewLayout === COLUMN_MODE) {
            $rootScope.$broadcast('previousConversation');

            return false;
        }
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

    var keys = [
        {keyboard: 'c', callback: composer},
        {keyboard: 'shift+r', callback: reply},
        {keyboard: 'shift+a', callback: replyAll},
        {keyboard: 'shift+f', callback: forward},
        {keyboard: 'left', callback: left},
        {keyboard: 'up', callback: up},
        {keyboard: 'right', callback: right},
        {keyboard: 'down', callback: down},
        {keyboard: 'r', callback: read},
        {keyboard: 'u', callback: unread},
        {keyboard: '*', callback: toggleStar},
        {keyboard: 't', callback: trash},
        {keyboard: 'a', callback: archive},
        {keyboard: 's', callback: spam},
        {keyboard: ['?'], callback: help}
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

angular.module('proton.hotkeys', [])
.factory('hotkeys', function(hotkeyModal, $rootScope) {
    var composer = function(event) {
        $rootScope.$broadcast('newMessage');

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
        {keyboard: ['C', 'c'], callback: composer},
        {keyboard: ['R', 'r'], callback: read},
        {keyboard: ['U', 'u'], callback: unread},
        {keyboard: ['*'], callback: toggleStar},
        {keyboard: ['T', 't'], callback: trash},
        {keyboard: ['A', 'a'], callback: archive},
        {keyboard: ['S', 's'], callback: spam},
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

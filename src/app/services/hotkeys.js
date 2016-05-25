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

    var hotkeys = {
        bind: function() {
            Mousetrap.bind(['C', 'c'], composer);
            Mousetrap.bind(['R', 'r'], read);
            Mousetrap.bind(['U', 'u'], unread);
            Mousetrap.bind(['*'], toggleStar);
            Mousetrap.bind(['T', 't'], trash);
            Mousetrap.bind(['A', 'a'], archive);
            Mousetrap.bind(['S', 's'], spam);
            Mousetrap.bind(['?'], help);
        },
        unbind: function() {
            Mousetrap.unbind(['C', 'c']);
            Mousetrap.unbind(['R', 'r']);
            Mousetrap.unbind(['U', 'u']);
            Mousetrap.unbind(['*']);
            Mousetrap.unbind(['T', 't']);
            Mousetrap.unbind(['A', 'a']);
            Mousetrap.unbind(['S', 's']);
            Mousetrap.unbind(['?']);
        }
    };

    return hotkeys;
});

angular.module('proton.hotkeys', [])
.factory('hotkeys', function(hotkeyModal, $rootScope) {
    var composer = function(event) {
        $rootScope.$broadcast('newMessage');
    };

    var read = function(event) {
        $rootScope.$broadcast('read');
    };

    var unread = function(event) {
        $rootScope.$broadcast('unread');
    };

    var trash = function(event) {
        $rootScope.$broadcast('move', 'trash');
    };

    var archive = function(event) {
        $rootScope.$broadcast('move', 'archive');
    };

    var spam = function(event) {
        $rootScope.$broadcast('move', 'spam');
    };

    var help = function() {
        hotkeyModal.activate({
            params: {
                close: function() {
                    hotkeyModal.deactivate();
                }
            }
        });
    };

    var hotkeys = {
        bind: function() {
            Mousetrap.bind(['C', 'c'], composer);
            Mousetrap.bind(['R', 'r'], read);
            Mousetrap.bind(['U', 'u'], unread);
            Mousetrap.bind(['T', 't'], trash);
            Mousetrap.bind(['A', 'a'], archive);
            Mousetrap.bind(['S', 's'], spam);
            Mousetrap.bind(['?'], help);
        },
        unbind: function() {
            Mousetrap.unbind(['C', 'c']);
            Mousetrap.unbind(['R', 'r']);
            Mousetrap.unbind(['U', 'u']);
            Mousetrap.unbind(['T', 't']);
            Mousetrap.unbind(['A', 'a']);
            Mousetrap.unbind(['S', 's']);
            Mousetrap.unbind(['?']);
        }
    };

    return hotkeys;
});

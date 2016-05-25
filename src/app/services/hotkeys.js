angular.module('proton.hotkeys', [])
.factory('hotkeys', function(hotkeyModal) {
    var hotkeys = {

    };

    Mousetrap.bind(['R', 'r'], function() {
        $scope.read();
    });
    Mousetrap.bind(['U', 'u'], function() {
        $scope.unread();
    });
    Mousetrap.bind(['space'], function() {
        $scope.toggleStar();
    });
    Mousetrap.bind(['T', 't'], function() {
        $scope.move('trash');
    });
    Mousetrap.bind(['A', 'a'], function() {
        $scope.move('archive');
    });
    Mousetrap.bind(['S', 's'], function() {
        $scope.move('spam');
    });
    Mousetrap.bind(['?'], function() {
        hotkeyModal.activate({
            params: {
                confirm: function() {
                    hotkeyModal.deactivate();
                },
                cancel: function() {
                    hotkeyModal.deactivate();
                }
            }
        });
    });

    return hotkeys;
});

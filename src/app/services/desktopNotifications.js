angular.module('proton.desktopNotifications', [])
.factory('desktopNotifications', function () {
    var notification = {
        supported: function() {
            return window.notify.isSupported;
        },
        status: function() {
            return window.notify.permissionLevel();
        },
        request: function(callback) {
            window.notify.requestPermission(callback);
        },
        create: function(title, params) {
            window.notify.createNotification(title, params);
        }
    };

    return notification;

});

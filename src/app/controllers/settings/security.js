angular.module("proton.controllers.Settings")

.controller('SecurityController', function(
    $log,
    $rootScope,
    $scope,
    gettextCatalog,
    authentication,
    confirmModal,
    Logs,
    networkActivityTracker,
    notify,
    Setting
) {
    $scope.logs = [];
    $scope.logItemsPerPage = 20;
    $scope.doLogging = authentication.user.LogAuth;

    /// logging page
    $scope.disabledText = gettextCatalog.getString('Disable', null, 'Action');
    $scope.haveLogs = false;

    $scope.loadLogs = function (page) {
        $scope.currentLogPage = page;
    };

    $scope.initLogs = function() {
        networkActivityTracker.track(
            Logs.getLogs().then(
                function(response) {
                    $scope.logs = _.sortBy(response.data.Logs, 'Time').reverse();
                    $scope.logCount = $scope.logs.length;
                    $scope.currentLogPage = 1;
                    $scope.haveLogs = true;
                },
                function(error) {
                    notify({message: gettextCatalog.getString('Error during the initialization of logs', null, 'Error'), classes: 'notification-danger'});
                    $log.error(error);
                }
            )
        );
    };

    $scope.clearLogs = function() {
        var title = gettextCatalog.getString('Clear', null, 'Title');
        var message = gettextCatalog.getString('Are you sure you want to clear all your logs?', null, 'Info');

        confirmModal.activate({
            params: {
                title: title,
                message: message,
                confirm: function() {
                    networkActivityTracker.track(
                        Logs.clearLogs()
                        .then(function(result) {
                            if (result.data && result.data.Code === 1000) {
                                $scope.logs = [];
                                $scope.logCount = 0;
                                notify({message: gettextCatalog.getString('Logs cleared', null), classes: 'notification-success'});
                            } else {

                            }
                        })
                    );
                    confirmModal.deactivate();
                },
                cancel: function() {
                    confirmModal.deactivate();
                }
            }
        });
    };

    $scope.downloadLogs = function () {
        var logsArray = [['Event', 'Time', 'IP']];
        var csvRows = [];
        var filename = 'logs.csv';

        _.forEach($scope.logs, function(log) {
          logsArray.push([log.Event, moment(log.Time * 1000), log.IP]);
        });

        for(var i=0, l=logsArray.length; i<l; ++i){
            csvRows.push(logsArray[i].join(','));
        }

        var csvString = csvRows.join("\r\n");
        var blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });

        saveAs(blob, filename);
    };

    $scope.setLogging = function(value) {
        if (value === 0) {
            confirmModal.activate({
                params: {
                    message: gettextCatalog.getString('Are you sure you want to clear all your logs?', null),
                    confirm: function() {
                        Setting.setLogging({LogAuth: 0});
                        $scope.doLogging = 0;
                        authentication.user.LogAuth = 0;
                        notify({message: gettextCatalog.getString('Logging preference updated', null), classes: 'notification-success'});
                        confirmModal.deactivate();
                        $scope.disabledText = gettextCatalog.getString('Disabled', null);
                    },
                    cancel: function() {
                        confirmModal.deactivate();
                    }
                }
            });
        } else {
            $scope.doLogging = value;
            authentication.user.LogAuth = value;
            Setting.setLogging({LogAuth: value});
            notify({message: gettextCatalog.getString('Logging preference updated', null), classes: 'notification-success'});

            /// logging page
            $scope.disabledText = gettextCatalog.getString('Disable', null, 'Action');
        }
    };

    $scope.exportPublicKey = function (clickEvent) {
        var element = angular.element(clickEvent.target);
        var pbk = authentication.user.PublicKey;
        var blob = new Blob([pbk], { type: 'data:text/plain;charset=utf-8;' });
        var filename = 'protonmail_public_' + authentication.user.Name + '.txt';

        try {
            saveAs(blob, filename);
        } catch (e) {
            $log.error(e);
        } finally {
            $log.debug('saveAs');
        }
    };

    // NOT USED
    $scope.exportEncPrivateKey = function () {
        var pbk = authentication.user.EncPrivateKey;
        var blob = new Blob([pbk], { type: 'data:text/plain;charset=utf-8;' });
        var filename = 'protonmail_private_'+authentication.user.Name+'.txt';

        saveAs(blob, filename);
    };
});

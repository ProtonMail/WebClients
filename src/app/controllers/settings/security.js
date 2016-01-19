angular.module("proton.controllers.Settings")

.controller('SecurityController', function(
    $log,
    $rootScope,
    $scope,
    $translate,
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
    $scope.disabledText = $translate.instant('DISABLE');

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
                },
                function(error) {
                    notify({message: 'Error during the initialization of logs', classes: 'notification-danger'});
                    $log.error(error);
                }
            )
        );
    };

    $scope.clearLogs = function() {
        var title = $translate.instant('CLEAR_LOGS');
        var message = 'Are you sure you want to clear all your logs?'; // TODO translate

        confirmModal.activate({
            params: {
                title: title,
                message: message,
                confirm: function() {
                    networkActivityTracker.track(
                        Logs.clearLogs().then(
                            function(response) {
                                $scope.logs = [];
                                $scope.logCount = 0;
                                notify({message: $translate.instant('LOGS_CLEARED'), classes: 'notification-success'});
                            },
                            function(error) {
                                notify({message: 'Error during the clear logs request', classes: 'notification-danger'});
                                $log.error(error);
                            }
                        )
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
        if(value === 0) {
            confirmModal.activate({
                params: {
                    message: 'This will delete all access logs, do you want to continue?', // TODO translate
                    confirm: function() {
                        Setting.setLogging({LogAuth: 0});
                        $scope.doLogging = 0;
                        authentication.user.LogAuth = 0;
                        notify({message: 'Logging Preference Updated', classes: 'notification-success'});
                        confirmModal.deactivate();
                        $scope.disabledText = $translate.instant('DISABLED');
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
            notify({message: 'Logging Preference Updated', classes: 'notification-success'});
            $scope.disabledText = $translate.instant('DISABLE');
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

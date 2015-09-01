angular.module("proton.controllers.Bug", [])

.controller("BugController", function(
    $scope,
    $rootScope,
    $state,
    $log,
    $translate,
    authentication,
    tools,
    Bug,
    networkActivityTracker,
    notify,
    CONFIG
) {
    // Variables
    var modalId = 'bugForm';

    // Listeners
    $scope.$on('openReportModal', function() {
        $log.debug('openReportModal:open');
        $scope.open();
    });

    // Methods
    $scope.initialization = function() {
        var username = (authentication.user && angular.isDefined(authentication.user.Name)) ? authentication.user.Name : '';

        $scope.bug = {
            OS:             tools.getOs,
            OSVersion:      '',
            Browser:         tools.getBrowser,
            BrowserVersion:  tools.getBrowserVersion,
            Client:         'Angular',
            ClientVersion:  CONFIG.app_version,
            Title:          '[Angular] Bug [' + $state.$current.name + ']',
            Description:    '',
            Username:        username,
            Email:          ''
        };
    };

    $scope.open = function() {
        $scope.initialization();
        $('#' + modalId).modal('show');
        $('#bug_os').focus();
    };

    $scope.close = function() {
        $('#' + modalId).modal('hide');
    };

    $scope.sendBugReport = function(form) {
        var deferred = $q.defer();
        var bugPromise = Bug.report($scope.bug);

        $log.debug('sendBugReport', $scope.bug);

        bugPromise.then(
            function(response) {
                $log.debug(response);

                if(angular.isUndefined(response.data.Error)) {
                    $scope.close();
                    deferred.resolve(response);
                    notify({message: $translate.instant('BUG_REPORTED'), classes: 'notification-success'});
                } else {
                    deferred.reject(response);
                    notify({message: response.data.Error, classes: 'notification-danger'});
                }
            },
            function(error) {
                notify({message: error, classes: 'notification-danger'});
                $log.error(error);
                deferred.reject(error);
            }
        );

        networkActivityTracker.track(deferred.promise);

        return deferred.promise;
    };
});

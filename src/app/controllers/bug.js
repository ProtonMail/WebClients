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
    var modalId = 'bugForm';

    $scope.initialization = function() {
        // $log.debug($state);
        var Username = (!$rootScope.isLocked && authentication.user !== undefined && authentication.user.Name !== undefined) ? authentication.user.Name : '';
        $scope.useragent = angular.element('html').attr('class');
        $scope.bug = {
            OS:             tools.getOs,
            OSVersion:      '',
            Browser:         tools.getBrowser,
            BrowserVersion:  tools.getBrowserVersion,
            Client:         'Angular',
            ClientVersion:  CONFIG.app_version,
            Title:          '[Angular] Bug ['+$state.$current.name+ ']',
            Description:    '',
            Username:        Username,
            Email:          ''
        };
        // $log.debug($scope.bug);
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

        $log.debug('sendBugReport');

        $log.debug($scope.bug);

        var bugPromise = Bug.report($scope.bug);

        $log.debug('sendBugReport');

        bugPromise.then(
            function(response) {
                $log.debug(response);
                if(angular.isUndefined(response.data.Error)) {
                    $scope.close();
                    notify($translate.instant('BUG_REPORTED'));
                }
                return response;
            },
            function(err) {
                $log.error(err);
            }
        );

        networkActivityTracker.track(bugPromise);
    };

    $scope.$on('openReportModal', function() {
        $log.debug('openReportModal:open');
        $scope.open();
    });

});

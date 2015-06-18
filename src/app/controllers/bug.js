angular.module("proton.controllers.Bug", [])

.controller("BugController", function(
    $scope,
    $rootScope,
    $state,
    $log,
    $translate,
    tools,
    Bug,
    networkActivityTracker,
    notify
) {
    var modalId = 'bugForm';

    $scope.open = function() {
        $scope.bug = {
            email: '',
            description: '',
            browser: tools.getBrowser + ' ' + tools.getBrowserVersion,
            location: $state.$current.url.sourcePath
        };

        $('#bug_os').val(tools.getOs);
        $('#' + modalId).modal('show');
        $('#bug_os').focus();
    };

    $scope.close = function() {
        $('#' + modalId).modal('hide');
    };

    $scope.sendBugReport = function(form) {
        var bugPromise = Bug.report({
            "OS": $('#bug_os').val(),
            "OSVersion": $scope.bug.osversion,
            "Client": $scope.bug.client,
            "ClientVersion": $scope.bug.clientversion,
            "Title": $scope.bug.title,
            "Description": $scope.bug.description,
            "Username": $rootScope.user.DisplayName,
            "Email": $scope.bug.email
        });

        bugPromise.then(function(response) {
            if(angular.isUndefined(response.data.Error)) {
                $scope.close();
                notify($translate.instant('BUG_REPORTED'));
            }

            return response;
        });

        networkActivityTracker.track(bugPromise);
    };

    $scope.$on('openReportModal', function() {
        $scope.open();
    });
});

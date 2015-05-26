angular.module("proton.controllers.Bug", [])

.controller("BugController", function(
    $scope,
    $rootScope,
    $state,
    $log,
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
        networkActivityTracker.track(
            Bug.bugs({
                "bug_os": $('#bug_os').val(),
                "bug_browser": $scope.bug.browser,
                "bug_location": $scope.bug.location,
                "bug_description": $scope.bug.description,
                "bug_email": $scope.bug.email
            }).$promise.then(function(response) {
                $scope.close();
                notify('Bug report sent');
            }, function(response) {
                $log.error(response);
            })
        );
    };

    $rootScope.$on('openReportModal', function() {
        $scope.open();
    });
});

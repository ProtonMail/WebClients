angular.module("proton.controllers.Bug", [])

.controller("BugController", function(
    $scope,
    $state,
    $log,
    tools,
    Bug,
    networkActivityTracker,
    notify
) {
    var modalId = 'bugForm';

    $scope.bug = {
        browser: tools.getBrowser + ' ' + tools.getBrowserVersion,
        location: $state.$current.url.sourcePath
    };

    $scope.open = function() {
        $('#' + modalId).modal('show');
    };

    $scope.close = function() {
        $('#' + modalId).modal('hide');
    };

    $scope.sendBugReport = function(form) {
        networkActivityTracker.track(
            Bug.bugs({
                "bug_device": $('#bug_device').val(),
                "bug_os": $('#bug_os').val(),
                "bug_browser": $scope.bug.browser,
                "bug_location": $scope.bug.location,
                "bug_description": $scope.bug.description,
                "bug_email": $scope.bug.email
            }).$promise.then(function(response) {
                $scope.close();
                notify('Bug reported');
            }, function(response) {
                $log.error(response);
            })
        );
    };
});

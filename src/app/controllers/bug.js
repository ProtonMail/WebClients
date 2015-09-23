angular.module("proton.controllers.Bug", [])

.controller("BugController", function(
    $scope,
    $rootScope,
    $state,
    $log,
    $q,
    $translate,
    $timeout,
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
            OS:             tools.getOs(),
            OSVersion:      '',
            Browser:         tools.getBrowser(),
            BrowserVersion:  tools.getBrowserVersion(),
            Client:         'Angular',
            ClientVersion:  CONFIG.app_version,
            Title:          '[Angular] Bug [' + $state.$current.name + ']',
            Description:    '',
            Username:        username,
            Email:          ''
        };
    };

    // Take a screenshot before we open the modal. then upload it if requested.
    $scope.takeScreenshot = function() {
        if (html2canvas) {
            html2canvas(document.body, {
                onrendered: function(canvas) {
                    try {
                        $scope.screen = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
                    } catch(e) {
                        $scope.screen = canvas.toDataURL().split(',')[1];
                    }
                }
            });
        }
    };

    // Returns a promise
    $scope.uploadScreenshot = function() {
        var deferred = $q.defer();
        $.ajax({
            url: 'https://api.imgur.com/3/image',
            headers: {
                'Authorization': 'Client-ID 864920c2f37d63f'
            },
            type: 'POST',
            data: {
                'image': $scope.screen
            },
            dataType: 'json',
            success: function(response) {
                if (response && response.data && response.data.link) {
                    $scope.bug.Description = $scope.bug.Description+'\n\n\n\n'+response.data.link;
                    deferred.resolve();
                }
                else {
                    deferred.reject();
                }
            },
            error: function() {
                deferred.reject();
            }
        });
        return deferred.promise;
    };

    $scope.open = function() {
        $scope.takeScreenshot();
        $timeout( function() {
            $scope.initialization();
            $('#' + modalId).modal('show');
            $('#bug_os').focus();
        }, 100);
    };

    $scope.close = function() {
        $('#' + modalId).modal('hide');
    };

    $scope.sendBugReport = function(form) {
        function sendReport() {
            var bugPromise = Bug.report($scope.bug);
            var deferred = $q.defer();

            bugPromise.then(
                function(response) {
                    if(response.data.Code === 1000) {
                        $scope.close();
                        deferred.resolve(response);
                        notify({message: $translate.instant('SENDING_BUG_REPORT'), classes: 'notification-success'});
                    } else if (angular.isDefined(response.data.Error)) {
                        response.message = response.data.Error;
                        deferred.reject(response);
                    }
                },
                function(err) {
                    error.message = 'Error during the sending request';
                    deferred.reject(error);
                }
            );

            networkActivityTracker.track(deferred.promise);

            return deferred.promise;
        }

        if ($scope.attachScreenshot) {
            $scope.uploadScreenshot().then(sendReport);
        } else {
            sendReport();
        }
    };
});

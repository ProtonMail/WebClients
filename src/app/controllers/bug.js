angular.module("proton.controllers.Bug", [])

.controller("BugController", function(
    $scope,
    $rootScope,
    $state,
    $log,
    $translate,
    $timeout,
    $q,
    authentication,
    tools,
    Bug,
    networkActivityTracker,
    notify,
    CONFIG
) {
    var modalId = 'bugForm';

    $scope.initialization = function() {
        var Username = (!$rootScope.isLocked && authentication.user !== undefined && authentication.user.Name !== undefined) ? authentication.user.Name : '';
        
        $scope.useragent = angular.element('html').attr('class');
        $scope.bug = {
            OS:             tools.getOs,
            OSVersion:      '',
            Browser:         tools.getBrowser,
            BrowserVersion:  tools.getBrowserVersion,
            Client:         'Angular',
            ClientVersion:  CONFIG.app_version,
            Title:          '[Angular] Bug [' + $state.$current.name + ']',
            Description:    '',
            Username:        Username,
            Email:          ''
        };

        // $log.debug($scope.bug);
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
            $log.debug('sendBugReport');

            $log.debug($scope.bug);

            var bugPromise = Bug.report($scope.bug);

            $log.debug('sendBugReport');

            bugPromise.then(
                function(response) {
                    $log.debug(response);
                    if(angular.isUndefined(response.data.Error)) {
                        notify($translate.instant('BUG_REPORTED'));
                    }
                    return response;
                },
                function(err) {
                    $log.error(err);
                }
            );

            networkActivityTracker.track(bugPromise);
        }

        $scope.close();
        notify($translate.instant('SENDING_BUG_REPORT'));
        if ($scope.attachScreenshot) {
            $scope.uploadScreenshot()
            .then( sendReport );
        }
        else {
            sendReport();
        }
    };

    $scope.$on('openReportModal', function() {
        $log.debug('openReportModal:open');
        $scope.open();
    });

});

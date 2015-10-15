angular.module("proton.controllers.Secured", [])

.controller("SecuredController", function(
    $scope,
    $rootScope,
    authentication,
    eventManager,
    cacheCounters,
    cacheMessages
) {
    $scope.user = authentication.user;

    $rootScope.isLoggedIn = true;
    $rootScope.isLocked = false;

    eventManager.start(authentication.user.EventID);
    cacheMessages.preloadInboxAndSent();
    cacheCounters.query();

    $rootScope.isSecure = function() {
        return authentication.isSecured();
    };

    /**
     * Returns a string for the storage bar
     * @return {String} "12.5"
     */
    $scope.storagePercentage = function() {
        if (authentication.user.UsedSpace && authentication.user.MaxSpace) {
            return Math.round(100 * authentication.user.UsedSpace / authentication.user.MaxSpace);
        } else {
            // TODO: error, undefined variables
            return '';
        }
    };
})

.run(function(
    $rootScope,
    $q,
    $state,
    $translate,
    authentication,
    Bug,
    bugModal,
    CONFIG,
    networkActivityTracker,
    notify,
    tools
) {
    var screen;

    /**
     * Open report modal
     */
    $rootScope.openReportModal = function() {
        console.log('openReportModal');
        var username = (authentication.user && angular.isDefined(authentication.user.Name)) ? authentication.user.Name : '';
        var form = {
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

        takeScreenshot().then(function() {
            bugModal.activate({
                params: {
                    form: form,
                    submit: function(form) {
                        sendBugReport(form).then(function() {
                            bugModal.deactivate();
                        });
                    },
                    cancel: function() {
                        bugModal.deactivate();
                    }
                }
            });
        });
    };

    var sendBugReport = function(form) {
        var deferred = $q.defer();

        function sendReport() {
            var bugPromise = Bug.report(form);

            bugPromise.then(
                function(response) {
                    if(response.data.Code === 1000) {
                        deferred.resolve(response);
                        notify({message: $translate.instant('BUG_REPORTED'), classes: 'notification-success'});
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
        }

        if (form.attachScreenshot) {
            uploadScreenshot(form).then(sendReport);
        } else {
            sendReport();
        }

        networkActivityTracker.track(deferred.promise);

        return deferred.promise;
    };

    /**
     *  Take a screenshot and store it
     */
    var takeScreenshot = function() {
        var deferred = $q.defer();

        if (html2canvas) {
            html2canvas(document.body, {
                onrendered: function(canvas) {
                    try {
                        screen = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
                    } catch(e) {
                        screen = canvas.toDataURL().split(',')[1];
                    }

                    deferred.resolve();
                }
            });
        } else {
            deferred.resolve();
        }

        return deferred.promise;
    };

    var uploadScreenshot = function(form) {
        var deferred = $q.defer();

        $.ajax({
            url: 'https://api.imgur.com/3/image',
            headers: {
                'Authorization': 'Client-ID 864920c2f37d63f'
            },
            type: 'POST',
            data: {
                'image': screen
            },
            dataType: 'json',
            success: function(response) {
                if (response && response.data && response.data.link) {
                    form.Description = form.Description+'\n\n\n\n'+response.data.link;
                    deferred.resolve();
                } else {
                    deferred.reject();
                }
            },
            error: function() {
                deferred.reject();
            }
        });

        return deferred.promise;
    };
});

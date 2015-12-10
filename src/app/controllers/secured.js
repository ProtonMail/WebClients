angular.module("proton.controllers.Secured", [])

.controller("SecuredController", function(
    $scope,
    $rootScope,
    $state,
    $stateParams,
    $translate,
    authentication,
    eventManager,
    cacheCounters,
    cache,
    CONSTANTS,
    Stripe,
    tools
) {
    var format;
    var language = window.navigator.userLanguage || window.navigator.language;

    if(language === 'en-US') {
        format = 'MM/DD/YYYY';
    } else {
        format = 'DD/MM/YYYY';
    }

    $rootScope.dateFormat = format;
    // Setting publishable key for Stripe
    Stripe.setPublishableKey('pk_test_xL4IzbxNCD9Chu98oxQVjYFe'); // TODO it's not the final key

    $scope.user = authentication.user;
    $rootScope.isLoggedIn = true;
    $rootScope.isLocked = false;
    $scope.settingsRoutes = [
        {value: 'secured.dashboard', label: $translate.instant('DASHBOARD')},
        {value: 'secured.account', label: $translate.instant('ACCOUNT')},
        {value: 'secured.labels', label: $translate.instant('LABELS')},
        {value: 'secured.security', label: $translate.instant('SECURITY')},
        {value: 'secured.dashboard', label: $translate.instant('DASHBOARD')},
        {value: 'secured.appearance', label: $translate.instant('APPEARANCE')},
        {value: 'secured.domains', label: $translate.instant('DOMAINS')},
        {value: 'secured.members', label: $translate.instant('USERS')},
        {value: 'secured.invoices', label: $translate.instant('INVOICES')}
    ];

    // Set event ID
    eventManager.start(authentication.user.EventID);
    // Preload conversations list (inbox and sent folder)
    cache.preloadInboxAndSent();
    // Initialize counters for conversation (total and unread)
    cacheCounters.query();

    // Listeners
    $scope.$on('updatePageName', function(event) { $scope.updatePageName(); });

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

    $scope.getEmails = function(emails) {
        return _.map(emails, function(email) {
            return email.Address;
        }).join(',');
    };

    /**
     * Go to route specified
     */
    $scope.goTo = function(route) {
        if(angular.isDefined(route)) {
            $state.go(route);
        }
    };

    /**
     * Initialize select
     */
    $scope.initSettingRoute = function() {
        var current = $state.$current.name;
        var route = _.findWhere($scope.settingsRoutes, {value: current});

        if(angular.isDefined(route)) {
            $scope.currentSettingRoute = route;
        }
    };

    /**
     * Update the browser title to display the current mailbox and
     * the number of unread messages in this folder
     */
    $scope.updatePageName = function() {
        var name;
        var unread = '';
        var state = tools.currentMailbox();

        switch (state) {
            case 'drafts':
                value = cacheCounters.unreadMessage(CONSTANTS.MAILBOX_IDENTIFIERS[state]);
                break;
            case 'label':
                value = cacheCounters.unreadConversation($stateParams.label);
                break;
            default:
                value = cacheCounters.unreadConversation(CONSTANTS.MAILBOX_IDENTIFIERS[state]);
                break;
        }

        if(angular.isDefined(value) && value > 0) {
            unread = '(' + value + ') ';
        }

        switch (state) {
            case 'inbox':
                name = unread + $translate.instant('INBOX');
                break;
            case 'drafts':
                name = unread + $translate.instant('DRAFTS');
                break;
            case 'sent':
                name = unread + $translate.instant('SENT');
                break;
            case 'starred':
                name = unread + $translate.instant('STARRED');
                break;
            case 'archive':
                name = unread + $translate.instant('ARCHIVE');
                break;
            case 'spam':
                name = unread + $translate.instant('SPAM');
                break;
            case 'trash':
                name = unread + $translate.instant('TRASH');
                break;
            case 'label':
                name = $translate.instant('LABEL');
                break;
            case 'contacts':
                name = $translate.instant('CONTACTS');
                break;
            case 'dashboard':
                name = $translate.instant('DASHBOARD');
                break;
            case 'account':
                name = $translate.instant('ACCOUNT');
                break;
            case 'labels':
                name = $translate.instant('LABELS');
                break;
            case 'security':
                name = $translate.instant('SECURITY');
                break;
            case 'appearance':
                name = $translate.instant('APPEARANCE');
                break;
            case 'domains':
                name = $translate.instant('DOMAINS');
                break;
            case 'users':
                name = $translate.instant('USERS');
                break;
            case 'invoices':
                name = $translate.instant('INVOICES');
                break;
            case 'login':
                name = $translate.instant('LOGIN');
                break;
            default:
                name = '';
                break;
        }

        $rootScope.pageName = name;
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

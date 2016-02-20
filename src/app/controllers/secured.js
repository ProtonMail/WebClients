angular.module("proton.controllers.Secured", [])

.controller("SecuredController", function(
    $cookies,
    $rootScope,
    $scope,
    $state,
    $stateParams,
    $timeout,
    $translate,
    $window,
    authentication,
    cache,
    cacheCounters,
    CONSTANTS,
    eventManager,
    feedbackModal,
    generateModal,
    tools
) {
    var format;
    var language = window.navigator.userLanguage || window.navigator.language;
    var dirtyAddresses = [];

    if(language === 'en-US') {
        format = 'MM/DD/YYYY';
    } else {
        format = 'DD/MM/YYYY';
    }

    $rootScope.dateFormat = format;

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

    // Set the rows / columns mode
    if (angular.isDefined(authentication.user) && angular.isDefined(authentication.user.ViewLayout)) {
        if (authentication.user.ViewLayout === 0) {
            $rootScope.layoutMode = 'columns';
        } else {
            $rootScope.layoutMode = 'rows';
        }
    }

    // Set event ID
    eventManager.start(authentication.user.EventID);
    // Initialize counters for conversation (total and unread)
    cacheCounters.query();

    // Listeners
    $scope.$on('updatePageName', function(event) { $scope.updatePageName(); });

    _.each(authentication.user.Addresses, function(address) {
        if (address.Keys.length === 0 && authentication.user.Private === 1) {
            dirtyAddresses.push(address);
        }
    });

    if (dirtyAddresses.length > 0 && generateModal.active() === false) {
        generateModal.activate({
            params: {
                title: 'Setting up your Addresses',
                message: 'Before you can start sending and receiving emails from your new addresses you need to create encryption keys for them. Simply select your preferred encryption strength and click "Generate Keys".', // TODO need text
                addresses: dirtyAddresses,
                cancel: function() {
                    eventManager.call();
                    generateModal.deactivate();
                }
            }
        });
    }

    // ===================================
    // FEEDBACK FORM (TEMPORARY - REMOVE ON SUNDAY / MONDAY)
    /*
    $timeout( function() {

        now = new Date();
        exp = new Date(now.getFullYear()+1, now.getMonth(), now.getDate());

        if(!$cookies.get('v3_feedback')) {
            $cookies.put('v3_feedback', 'true', {
                'expires': exp
            });
            // Open feedback modal
            feedbackModal.activate({
                params: {
                    close: function() {
                        feedbackModal.deactivate();
                    }
                }
            });
        }
    }, 1 * 60 * 1000); // 2 mins
    */
    // END FEEDBACK
    // ===================================

    /**
     * Returns a string for the storage bar
     * @return {String} "12.5"
     */
    $scope.storagePercentage = function() {
        if (authentication.user && authentication.user.UsedSpace && authentication.user.MaxSpace) {
            return Math.round(100 * authentication.user.UsedSpace / authentication.user.MaxSpace);
        } else {
            // TODO: error, undefined variables
            return '';
        }
    };

    /**
     * Returns a string for the storage bar
     * @return {String} "123/456 [MB/GB]"
     */
    $scope.storageUsed = function() {
        if (authentication.user.UsedSpace && authentication.user.MaxSpace) {
            var gb = 1073741824;
            var mb = 1048576;
            var units = (authentication.user.MaxSpace >= gb) ? 'GB' : 'MB';
            var total = authentication.user.MaxSpace;
            var used = authentication.user.UsedSpace;
            if (units === 'GB') {
                used = (used / gb);
                total = (total / gb);
            }
            else {
                used = (used / mb);
                total = (total / mb);
            }
            return used.toFixed(1) + '/' + total + ' ' + units;
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
                value = cacheCounters.unreadConversation($state.params.label);
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
                var label = _.findWhere(authentication.user.Labels, {ID: $state.params.label});

                if (angular.isDefined(label)) {
                    name = label.Name;
                } else {
                    name = $translate.instant('LABEL');
                }
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
});

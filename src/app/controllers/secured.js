angular.module("proton.controllers.Secured", [])

.controller("SecuredController", function(
    $cookies,
    $filter,
    $rootScope,
    $scope,
    $state,
    $stateParams,
    $timeout,
    gettext,
    $window,
    authentication,
    cache,
    cacheCounters,
    CONSTANTS,
    eventManager,
    feedbackModal,
    generateModal,
    organization,
    tools
) {
    var dirtyAddresses = [];

    $scope.user = authentication.user;
    $scope.organization = organization;
    $rootScope.isLoggedIn = true; // Shouldn't be there
    $rootScope.isLocked = false; // Shouldn't be there
    $scope.settingsRoutes = [
        {value: 'secured.dashboard', label: gettext('DASHBOARD')},
        {value: 'secured.account', label: gettext('ACCOUNT')},
        {value: 'secured.labels', label: gettext('LABELS')},
        {value: 'secured.security', label: gettext('SECURITY')},
        {value: 'secured.dashboard', label: gettext('DASHBOARD')},
        {value: 'secured.appearance', label: gettext('APPEARANCE')},
        {value: 'secured.domains', label: gettext('DOMAINS')},
        {value: 'secured.members', label: gettext('USERS')},
        {value: 'secured.payments', label: gettext('PAYMENTS')}
    ];

    // Set language used for the application
    gettext.use(authentication.user.Language);

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

    $scope.$on('updateUser', function(event) {
        gettext.use(authentication.user.Language);
    });

    $scope.$on('organizationChange', function(event, organization) {
        $scope.organization = organization;
    });

    _.each(authentication.user.Addresses, function(address) {
        if (address.Keys.length === 0 && address.Status === 1 && authentication.user.Private === 1) {
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

    $scope.idDefined = function() {
        var id = $state.params.id;

        return angular.isDefined(id) && id.length > 0;
    };

    /**
     * Returns a string for the storage bar
     * @return {String} "12.5"
     */
    $scope.storagePercentage = function() {
        if (authentication.user && authentication.user.UsedSpace && authentication.user.MaxSpace) {
            return Math.round(100 * authentication.user.UsedSpace / authentication.user.MaxSpace);
        } else {
            return '';
        }
    };

    $scope.storageString = function() {
        return $filter('humanSize')(authentication.user.UsedSpace) + ' / ' + $filter('humanSize')(authentication.user.UsedSpace);
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
                name = unread + gettext('INBOX');
                break;
            case 'drafts':
                name = unread + gettext('DRAFTS');
                break;
            case 'sent':
                name = unread + gettext('SENT');
                break;
            case 'starred':
                name = unread + gettext('STARRED');
                break;
            case 'archive':
                name = unread + gettext('ARCHIVE');
                break;
            case 'spam':
                name = unread + gettext('SPAM');
                break;
            case 'trash':
                name = unread + gettext('TRASH');
                break;
            case 'label':
                var label = _.findWhere(authentication.user.Labels, {ID: $state.params.label});

                if (angular.isDefined(label)) {
                    name = label.Name;
                } else {
                    name = gettext('LABEL');
                }
                break;
            case 'contacts':
                name = gettext('CONTACTS');
                break;
            case 'dashboard':
                name = gettext('DASHBOARD');
                break;
            case 'account':
                name = gettext('ACCOUNT');
                break;
            case 'labels':
                name = gettext('LABELS');
                break;
            case 'security':
                name = gettext('SECURITY');
                break;
            case 'appearance':
                name = gettext('APPEARANCE');
                break;
            case 'domains':
                name = gettext('DOMAINS');
                break;
            case 'users':
                name = gettext('USERS');
                break;
            case 'invoices':
                name = gettext('INVOICES');
                break;
            case 'login':
                name = gettext('LOGIN');
                break;
            default:
                name = '';
                break;
        }

        $rootScope.pageName = name;
    };
});

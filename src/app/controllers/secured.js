angular.module("proton.controllers.Secured", [])
.constant('regexEmail', /(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/gi)
.controller("SecuredController", function(
    $cookies,
    $filter,
    $rootScope,
    $scope,
    $state,
    $stateParams,
    $timeout,
    gettextCatalog,
    $window,
    authentication,
    cache,
    cacheCounters,
    CONSTANTS,
    eventManager,
    feedbackModal,
    generateModal,
    organization,
    tools,
    desktopNotifications
) {
    var dirtyAddresses = [];

    $scope.user = authentication.user;
    $scope.isAdmin = authentication.user.Role === CONSTANTS.PAID_ADMIN;
    $scope.isFree = authentication.user.Role === CONSTANTS.FREE_USER;
    $scope.organization = organization;
    $rootScope.isLoggedIn = true; // Shouldn't be there
    $rootScope.isLocked = false; // Shouldn't be there
    $scope.settingsRoutes = [
        {value: 'secured.dashboard', label: gettextCatalog.getString('Dashboard', null, 'Title')},
        {value: 'secured.account', label: gettextCatalog.getString('Account', null, 'Title')},
        {value: 'secured.labels', label: gettextCatalog.getString('Labels', null, 'Title')},
        {value: 'secured.security', label: gettextCatalog.getString('Security', null, 'Title')},
        {value: 'secured.dashboard', label: gettextCatalog.getString('Dashboard', null, 'Title')},
        {value: 'secured.appearance', label: gettextCatalog.getString('Appearance', null, 'Title')},
        {value: 'secured.domains', label: gettextCatalog.getString('Domains', null, 'Title')},
        {value: 'secured.members', label: gettextCatalog.getString('Users', null, 'Title')},
        {value: 'secured.payments', label: gettextCatalog.getString('Payments', null, 'Title')},
        {value: 'secured.filters', label: gettextCatalog.getString('Filters', null, 'Title')}
    ];

    // Set language used for the application
    gettextCatalog.setCurrentLanguage(authentication.user.Language);

    // Request for desktop notification
    desktopNotifications.request();

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
        $scope.user = authentication.user;
        $scope.isAdmin = authentication.user.Role === CONSTANTS.PAID_ADMIN;
        $scope.isFree = authentication.user.Role === CONSTANTS.FREE_USER;
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

    $scope.storagePourcentage = function() {
        return Math.round(100 * authentication.user.UsedSpace / authentication.user.MaxSpace);
    };

    $scope.storageStyle = function() {
        return {
            width: $scope.storagePourcentage() + '%'
        };
    };

    $scope.storageString = function() {
        return $filter('humanSize')(authentication.user.UsedSpace) + ' / ' + $filter('humanSize')(authentication.user.MaxSpace);
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
                name = unread + gettextCatalog.getString('Inbox', null, 'Title');
                break;
            case 'drafts':
                name = unread + gettextCatalog.getString('Drafts', null, 'Title');
                break;
            case 'sent':
                name = unread + gettextCatalog.getString('Sent', null, 'Title');
                break;
            case 'starred':
                name = unread + gettextCatalog.getString('Starred', null, 'Title');
                break;
            case 'archive':
                name = unread + gettextCatalog.getString('Archive', null, 'Title');
                break;
            case 'spam':
                name = unread + gettextCatalog.getString('Spam', null, 'Title');
                break;
            case 'trash':
                name = unread + gettextCatalog.getString('Trash', null, 'Title');
                break;
            case 'label':
                var label = _.findWhere(authentication.user.Labels, {ID: $state.params.label});

                if (angular.isDefined(label)) {
                    name = label.Name;
                } else {
                    name = gettextCatalog.getString('Label', null, 'Title');
                }
                break;
            case 'contacts':
                name = gettextCatalog.getString('Contacts', null, 'Title');
                break;
            case 'dashboard':
                name = gettextCatalog.getString('Dashboard', null, 'Title');
                break;
            case 'account':
                name = gettextCatalog.getString('Account', null, 'Title');
                break;
            case 'labels':
                name = gettextCatalog.getString('Labels', null, 'Title');
                break;
            case 'security':
                name = gettextCatalog.getString('Security', null, 'Title');
                break;
            case 'appearance':
                name = gettextCatalog.getString('Appearance', null, 'Title');
                break;
            case 'domains':
                name = gettextCatalog.getString('Domains', null, 'Title');
                break;
            case 'users':
                name = gettextCatalog.getString('Users', null, 'Title');
                break;
            case 'invoices':
                name = gettextCatalog.getString('Invoices', null, 'Title');
                break;
            case 'login':
                name = gettextCatalog.getString('Login', null, 'Title');
                break;
            default:
                name = '';
                break;
        }

        $rootScope.pageName = name;
    };
});

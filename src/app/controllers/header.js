angular.module('proton.controllers.Header', [])

.controller('HeaderController', function(
    $location,
    $log,
    $rootScope,
    $scope,
    $state,
    $stateParams,
    $translate,
    authentication,
    CONFIG,
    CONSTANTS,
    notify,
    tools
) {
    $scope.params = {};
    $scope.appVersion = CONFIG.app_version;
    $scope.wizardEnabled = CONSTANTS.WIZARD_ENABLED;
    $scope.addresses = [];
    $scope.addresses.push({Email: $translate.instant('ALL'), ID: undefined, Send: 0, Receive: 1, Status: 1}); // Add ALL option

    if (authentication.user) { // This code is also executed on the login page, it explain this condition
        $scope.addresses = $scope.addresses.concat(authentication.user.Addresses);
    }

    $scope.ctrl = {};
    $scope.ctrl.attachments = 2;
    $scope.ctrl.address = $scope.addresses[0]; // Select ALL
    $scope.advancedSearch = false;
    $scope.starred = 2;
    $scope.folders = angular.copy(CONSTANTS.MAILBOX_IDENTIFIERS);
    delete $scope.folders.search;
    delete $scope.folders.label;

    var setPath = function() {
        var mailbox = $state.$current.name.replace('secured.', '').replace('.view', '');

        if (mailbox === 'label') {
            var label = _.findWhere(authentication.user.Labels, {ID: $stateParams.label});

            if (angular.isDefined(label)) {
                mailbox = label.Name;
            }
        }

        $scope.path = mailbox;
    };

    /**
     * Return parameters from String
     * @return {Object}
     */
    var extractParameters = function() {
        var parameters = {};
        var value = $scope.params.searchMessageInput;
        var splitted = value.split(' ');

        for (var i = 0; i < splitted.length; i++) {
            var part = splitted[i];

            if (part.indexOf('keyword:') !== -1) {
                parameters.keyword = part.replace('keyword:', '');
            }

            if (part.indexOf('from:') !== -1) {
                parameters.from = part.replace('from:', '');
            }

            if (part.indexOf('to:') !== -1) {
                parameters.to = part.replace('to:', '');
            }

            if (part.indexOf('label:') !== -1) {
                parameters.label = part.replace('label:', '');
            }
        }

        if (Object.keys(parameters).length === 0 && value.length > 0) {
            parameters.keyword = value;
        }

        return parameters;
    };

    /**
     * Generate an special Object to reset $stateParams values
     * @return {Object}
     */
    var resetParameters = function() {
        return {
            address: undefined,
            page: undefined,
            filter: undefined,
            sort: undefined,
            label: undefined,
            from: undefined,
            to: undefined,
            subject: undefined,
            keyword: undefined,
            begin: undefined,
            end: undefined,
            attachments: undefined,
            starred: undefined,
            reload: undefined
        };
    };

    /**
     * Generate string from parameters set inside the URL
     */
    var generateSearchString = function() {
        var result = '';

        if (angular.isDefined($stateParams.keyword)) {
            if (angular.isUndefined($stateParams.from) && angular.isUndefined($stateParams.to) && angular.isUndefined($stateParams.label)) {
                result += $stateParams.keyword + ' ';
            } else {
                result += 'keyword:' + $stateParams.keyword + ' ';
            }
        }

        if (angular.isDefined($stateParams.from)) {
            result += 'from:' + $stateParams.from + ' ';
        }

        if (angular.isDefined($stateParams.to)) {
            result += 'to:' + $stateParams.to + ' ';
        }

        if (angular.isDefined($stateParams.label)) {
            result += 'label:' + $stateParams.label + ' ';
        }

        $scope.params.searchMessageInput = result;
        $scope.params.searchContactInput = '';
    };

    // Listeners
    $scope.$on('$stateChangeSuccess', function(event) {
        $scope.initialization();
    });

    $scope.$on('updateUser', function(event) {
        $scope.addresses = [];
        $scope.addresses.push({Email: $translate.instant('ALL'), ID: undefined});

        if (authentication.user) {
            $scope.addresses = $scope.addresses.concat(authentication.user.Addresses);
        }

        $scope.ctrl.address = $scope.addresses[0];
    });

    $scope.initialization = function() {
        setPath();
        generateSearchString();
    };

    /**
     * Call event to open new composer
     */
    $scope.compose = function() {
        $rootScope.$broadcast('newMessage');
    };

    $scope.tour = function() {
        $rootScope.$broadcast('tourStart');
    };

    $scope.toggleAdvancedSearch = function() {
        if ($scope.advancedSearch === false) {
            $scope.openSearchModal();
        } else {
            $scope.closeSearchModal();
        }
    };

    $scope.openSearchModal = function() {
        var parameters = extractParameters();

        $scope.labels = authentication.user.Labels;
        $scope.ctrl.keyword = parameters.keyword || '';
        $scope.ctrl.from = parameters.from || '';
        $scope.ctrl.to = parameters.to || '';

        if (angular.isDefined(parameters.label)) {
            $('#search_folder').val(parameters.label);
        }

        $scope.advancedSearch = true;
    };

    $scope.closeSearchModal = function() {
        $scope.advancedSearch = false;
    };

    $scope.sidebarToggle = function() {
        $rootScope.$broadcast('sidebarMobileToggle');
    };

    $scope.searchMessages = function() {
        var parameters = resetParameters();

        if ($scope.advancedSearch === false) {
            // if ($scope.params.searchMessageInput.length === 0) {
            //     $state.go('secured.inbox');
            // } else {
                angular.merge(parameters, extractParameters());
            // }
        } else {
            parameters.keyword = $scope.ctrl.keyword;
            parameters.from = $scope.ctrl.from;
            parameters.to = $scope.ctrl.to;
            parameters.subject = $scope.ctrl.subject;
            parameters.attachments = parseInt($scope.ctrl.attachments);

            if (angular.isDefined($scope.ctrl.address.ID)) {
                parameters.address = $scope.ctrl.address.ID;
            }

            if(parseInt($('#search_folder').val()) !== -1) {
                parameters.label = $('#search_folder').val();
            }

            if($('#search_start').val().length > 0) {
                parameters.begin = $scope.ctrl.start.getMoment().unix();
            }

            if($('#search_end').val().length > 0) {
                parameters.end = $scope.ctrl.end.getMoment().unix();
            }
        }

        $state.go('secured.search', parameters);
        $scope.advancedSearch = false;
    };

    $scope.focusStart = function() {
        $('#search_start').trigger('click');
    };

    $scope.focusEnd = function() {
        $('#search_end').trigger('click');
    };

    $scope.setMin = function() {
        if($scope.ctrl.start.getDate() === null) {
            $scope.ctrl.start = null;
        } else {
            $scope.ctrl.end.setMinDate($scope.ctrl.start.getDate());
        }
    };

    $scope.setMax = function() {
        if($scope.ctrl.end === null && $scope.ctrl.end.getDate() === null) {
            $scope.ctrl.end = null;
        } else {
            $scope.ctrl.start.setMaxDate($scope.ctrl.end.getDate());
        }
    };

    $scope.cancel = function() {
        if (angular.isDefined($scope.params.cancel) && angular.isFunction($scope.params.cancel)) {
            $scope.params.cancel();
        }
    };

    $scope.activeMail = function() {
        var folders = Object.keys(CONSTANTS.MAILBOX_IDENTIFIERS);
        var mailbox = $state.$current.name.replace('secured.', '').replace('.view', '');

        return folders.indexOf(mailbox) !== -1;
    };

    $scope.activeSettings = function() {
        var route = $state.$current.name.replace('secured.', '');
        var settings = ['account', 'labels', 'security', 'appearance', 'domains', 'addresses', 'users', 'payments', 'keys'];

        return settings.indexOf(route) !== -1;
    };

    $scope.searchContacts = function() {
        $rootScope.$broadcast('searchContacts', $scope.params.searchContactInput);
    };

    $scope.closeMobileDropdown = function() {
        $(".navbar-toggle").click();
    };

    $scope.openNewMessage = function() {
        $rootScope.$broadcast('newMessage');
    };

    $scope.displayName = function() {
        var displayName = '';

        if(authentication.user) {
            displayName = authentication.user.DisplayName || authentication.user.Name;
        } else if($rootScope.tempUser && $rootScope.tempUser.username) {
            displayName = $rootScope.tempUser.username;
        }

        // Truncate
        if (displayName && displayName.length > 20) {
            displayName = displayName.substring(0, 17) + '...';
        }

        return displayName;
    };

    $scope.email = function() {
        if (authentication.user) {
            var address = _.findWhere(authentication.user.Addresses, {Send: 1});

            if (address) {
                return address.Email;
            } else {
                return '';
            }
        } else {
            return '';
        }
    };

    $scope.initialization();
});

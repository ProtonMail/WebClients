angular.module("proton.controllers.Header", [])

.controller("HeaderController", function(
    $log,
    $rootScope,
    $scope,
    $state,
    $stateParams,
    $location,
    notify,
    CONSTANTS,
    authentication,
    searchModal,
    tools
) {
    $scope.params = {
        searchMessageInput: $stateParams.words || '',
        searchContactInput: ''
    };

    $scope.ctrl = {};
    $scope.ctrl.attachments = 2;
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

    $scope.$on('openSearchModal', function(event, value) {
        $scope.openSearchModal(value);
    });

    $scope.$on('$stateChangeSuccess', function(event) {
        setPath();

        if($state.is('secured.search') === false) {
            $scope.params.searchMessageInput = '';
        }
    });

    setPath();

    /**
     * Call event to open new composer
     */
    $scope.compose = function() {
        $rootScope.$broadcast('newMessage');
    };

    $scope.tour = function() {
        $rootScope.$broadcast('tourStart');
    };

    $scope.openSearchModal = function() {
        console.log('search?', $scope.advancedSearch);
        $scope.labels = authentication.user.Labels;
        $scope.advancedSearch = !$scope.advancedSearch;
    };

    $scope.closeSearchModal = function() {
        $scope.advancedSearch = !$scope.advancedSearch;
    };

    $scope.isContactsView = function() {
        return $state.is('secured.contacts');
    };

    $scope.sidebarToggle = function() {
        $rootScope.$broadcast('sidebarMobileToggle');
    };

    $scope.resetSearchParameters = function() {
        var keys = Object.keys($stateParams);
        var params = {};

        _.each(keys, function(key) {
            params[key] = undefined;
        });

        return params;
    };

    $scope.searchMessages = function() {
        if($scope.params.searchMessageInput.length > 0) {
            var params = $scope.resetSearchParameters();

            params.words = $scope.params.searchMessageInput;

            $state.go('secured.search', params);
        } else {
            $state.go('secured.inbox');
        }
    };

    $scope.searchAdvanced = function() {
        var parameters = {};

        parameters.words = $scope.params.searchMessageInput;
        parameters.from = $scope.ctrl.from;
        parameters.to = $scope.ctrl.to;
        parameters.subject = $scope.ctrl.subject;
        parameters.attachments = parseInt($scope.ctrl.attachments);

        console.log(parameters);

        if(parseInt($('#search_folder').val()) !== -1) {
            parameters.label = $('#search_folder').val();
        } else {
            parameters.label = null;
        }

        if($('#search_start').val().length > 0) {
            parameters.begin = $scope.ctrl.start.getMoment().unix();
        }

        if($('#search_end').val().length > 0) {
            parameters.end = $scope.ctrl.end.getMoment().unix();
        }

        $state.go('secured.search', parameters);
        $scope.advancedSearch = false;
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
        var settings = ['dashboard', 'account', 'labels', 'security', 'appearance', 'invoices', 'domains', 'users'];

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
            }
            else {
                return '';
            }
        }
        else {
            return '';
        }
    };
});

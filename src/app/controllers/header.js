angular.module('proton.controllers.Header', [])

.controller('HeaderController', function(
    $location,
    $log,
    $rootScope,
    $scope,
    $state,
    $stateParams,
    gettextCatalog,
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
    $scope.addresses.push({Email: gettextCatalog.getString('All', null), ID: undefined, Send: 0, Receive: 1, Status: 1}); // Add ALL option

    if (authentication.user) { // This code is also executed on the login page, it explain this condition
        $scope.addresses = $scope.addresses.concat(authentication.user.Addresses);
    }

    $scope.ctrl = {};
    $scope.ctrl.attachments = 2;
    $scope.ctrl.address = $scope.addresses[0]; // Select ALL
    $scope.advancedSearch = false;
    $scope.starred = 2;

    var addFolders = function() {
        $scope.ctrl.folders = [];
        $scope.ctrl.folders.push({value: -1, label: gettextCatalog.getString('All', null), group: 'default'});

        _.each(CONSTANTS.MAILBOX_IDENTIFIERS, function(value, key) {
            if (key !== 'search' && key !== 'label') {
                $scope.ctrl.folders.push({value: value, label: key, group: 'folder'});
            }
        });

        if (authentication.user) {
            _.each(authentication.user.Labels, function(label) {
                $scope.ctrl.folders.push({value: label.ID, label: label.Name, group: 'label'});
            });
        }

        $scope.ctrl.folder = $scope.ctrl.folder || $scope.ctrl.folders[0];
    };

    /**
     * Return parameters from String
     * @return {Object}
     */
    var extractParameters = function() {
        var parameters = {};
        var value = $scope.params.searchMessageInput;
        var separators = [
            {value: 'keyword:', key: 'keyword'},
            {value: 'from:', key: 'from'},
            {value: 'to:', key: 'to'},
            {value: 'in:', key: 'label'}
        ];

        _.each(separators, function(separator) {
            var tmp = value.split(separator.value);

            _.each(separators, function(sep) {
                if (tmp[1] && tmp[1].indexOf(sep.value) !== -1) {
                    tmp[1] = tmp[1].split(sep.value)[0];
                }
            });

            if (tmp[1]) {
                var tmp1 = tmp[1].trim();

                if (separator.key === 'label') {
                    var folder = _.findWhere($scope.ctrl.folders, {label: tmp1});

                    if (angular.isDefined(folder)) {
                        parameters.label = folder.value;
                    }
                } else {
                    parameters[separator.key] = tmp1;
                }
            }
        });

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

        if (angular.isDefined($stateParams.label)) {
            var folder = _.findWhere($scope.ctrl.folders, {value: $stateParams.label});

            if (angular.isDefined(folder)) {
                result += 'in:' + folder.label + ' ';
            }
        }

        if (angular.isDefined($stateParams.keyword)) {
            if (angular.isUndefined($stateParams.from) && angular.isUndefined($stateParams.to) && angular.isUndefined($stateParams.label)) {
                result += $stateParams.keyword + ' ';
            } else {
                result += 'keyword:' + $stateParams.keyword + ' ';
            }
        } else if (angular.isDefined($stateParams.label)) {
            result += 'keyword: ';
        }

        if (angular.isDefined($stateParams.from)) {
            result += 'from:' + $stateParams.from + ' ';
        }

        if (angular.isDefined($stateParams.to)) {
            result += 'to:' + $stateParams.to + ' ';
        }

        $scope.params.searchMessageInput = result;
        $scope.params.searchContactInput = '';
    };

    // Listeners
    $scope.$on('$stateChangeSuccess', function(event) {
        addFolders();
        generateSearchString();
    });

    $scope.$on('updateUser', function(event) {
        $scope.addresses = [];
        $scope.addresses.push({Email: gettextCatalog.getString('All', null), ID: undefined});

        if (authentication.user) {
            $scope.addresses = $scope.addresses.concat(authentication.user.Addresses);
        }

        $scope.ctrl.address = $scope.addresses[0];
    });

    $scope.initialization = function() {
        addFolders();
        generateSearchString();
    };

    /**
     * Call event to open new composer
     */
    $scope.compose = function() {
        $rootScope.$broadcast('newMessage');
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
        $scope.ctrl.folder = _.findWhere($scope.ctrl.folders, {value: parameters.label}) || $scope.ctrl.folders[0];
        $scope.advancedSearch = true;
    };

    $scope.closeSearchModal = function() {
        $scope.advancedSearch = false;
    };

    $scope.sidebarToggle = function() {
        $rootScope.$broadcast('sidebarMobileToggle');
    };

    $scope.blurSearch = function(event) {
        var inputs = angular.element('.query');

        angular.element(inputs[0]).blur();
    };

    $scope.searchMessages = function() {
        var parameters = resetParameters();
        var redirection;

        if ($scope.advancedSearch === false) {
            if ($scope.params.searchMessageInput.length === 0) {
                redirection = 'secured.inbox';
            } else {
                redirection = 'secured.search';
                angular.merge(parameters, extractParameters());
            }
        } else {
            redirection = 'secured.search';
            parameters.keyword = $scope.ctrl.keyword;
            parameters.from = $scope.ctrl.from;
            parameters.to = $scope.ctrl.to;
            parameters.subject = $scope.ctrl.subject;
            parameters.attachments = parseInt($scope.ctrl.attachments);

            if (angular.isDefined($scope.ctrl.address.ID)) {
                parameters.address = $scope.ctrl.address.ID;
            }

            if($scope.ctrl.folder.value !== -1) {
                parameters.label = $scope.ctrl.folder.value;
            }

            if($('#search_start').val().length > 0) {
                parameters.begin = $scope.ctrl.start.getMoment().unix();
            }

            if($('#search_end').val().length > 0) {
                parameters.end = $scope.ctrl.end.getMoment().unix();
            }
        }

        $state.go(redirection, parameters);
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

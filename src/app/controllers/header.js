angular.module("proton.controllers.Header", [])

.controller("HeaderController", function(
    $log,
    $rootScope,
    $scope,
    $state,
    $stateParams,
    CONSTANTS,
    authentication,
    wizardModal,
    searchModal
) {
    $scope.params = {
        searchMessageInput: $stateParams.words || '',
        searchContactInput: ''
    };

    $scope.showSidebar = $rootScope.showSidebar;

    $scope.$on('openSearchModal', function(event, value) {
        $scope.openSearchModal(value);
    });

    function openWizardModal(title, version) {
        wizardModal.activate({
            params: {
                title: title,
                version: version,
                cancel: function() {
                    wizardModal.deactivate();
                }
            }
        });
    }

    /* TEMPORARY */
    $scope.testToggleLayout = function() {
        if ($rootScope.layoutMode === 'rows') {
            $rootScope.layoutMode = 'columns';
        }
        else {
            $rootScope.layoutMode = 'rows';
        }
    };
    /* END TEMPORARY */

    /**
     * Call event to open new composer
     */
    $scope.compose = function() {
        $rootScope.$broadcast('newMessage');
    };

    $scope.openSearchModal = function(value) {
        searchModal.activate({
            params: {
                keywords: value,
                search: function(result) {
                    searchModal.deactivate();
                    var params = $scope.resetSearchParameters();

                    _.extend(params, result);
                    $state.go('secured.search.list', params);
                },
                cancel: function() {
                    searchModal.deactivate();
                }
            }
        });
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
            if (params.words==='bartsnackies') {
                $scope.snackies = true;
            }
            else {
                $scope.snackies = false;
                $state.go('secured.search.list', params);
            }
        } else {
            $state.go('secured.inbox.list');
        }
    };

    $scope.activeMail = function() {
        var folders = Object.keys(CONSTANTS.MAILBOX_IDENTIFIERS);
        var mailbox = $state.$current.name.replace('secured.', '').replace('.list', '').replace('.view', '');

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

    $scope.openWizard = function() {
        openWizardModal('ProtonMail Wizard', 'startWizard');
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

    $scope.toggleLayoutMode = function() {
        if($rootScope.layoutMode === 'rows') {
            $rootScope.layoutMode = 'columns';
        } else {
            $rootScope.layoutMode = 'rows';
        }
    };
});

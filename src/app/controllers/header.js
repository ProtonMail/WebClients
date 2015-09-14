angular.module("proton.controllers.Header", [])

.controller("HeaderController", function(
    $log,
    $rootScope,
    $scope,
    $state,
    $stateParams,
    authentication,
    wizardModal
) {
    $scope.params = {
        searchInput: $stateParams.words || ''
    };

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

    $scope.searchMessages = function() {
        if($scope.params.searchInput.length > 0) {
            $rootScope.$broadcast('search', $scope.params.searchInput);
        } else {
            $state.go('secured.inbox');
        }
    };

    $scope.closeMobileDropdown = function() {
        $(".navbar-toggle").click();
    };

    $scope.openNewMessage = function() {
        $rootScope.$broadcast('newMessage');
    };

    $scope.openSearchModal = function() {
        $rootScope.$broadcast('openSearchModal', $scope.params.searchInput);
    };

    $scope.openReportModal = function() {
        $log.debug('openReportModal:broadcast');
        $rootScope.$broadcast('openReportModal');
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
});

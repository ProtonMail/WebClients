angular.module("proton.controllers.Header", [])

.controller("HeaderController", function($scope, $state, $stateParams, wizardModal, $rootScope) {
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

    $scope.search = function() {
        if($scope.params.searchInput.length > 0) {
            $rootScope.$broadcast('search', $scope.params.searchInput);
        } else {
            $state.go('secured.inbox');
        }
    };

    $scope.openNewMessage = function() {
        $rootScope.$broadcast('newMessage');
    };

    $scope.openSearchModal = function() {
        $rootScope.$broadcast('openSearchModal');
    };

    $scope.openReportModal = function() {
        $rootScope.$broadcast('openReportModal');
    };

    $scope.onBlurSearch = function() {
        if($scope.params.searchInput.length === 0) {
            $scope.searchInputFocus = false;
        }
    };

    $scope.onFocusSearch = function() {
        $scope.searchInputFocus = true;
    };


    $scope.openWizard = function() {
        openWizardModal('ProtonMail Wizard', 'startWizard');
    };
});

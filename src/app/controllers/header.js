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

    $scope.searchMessages = function() {
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
        $rootScope.$broadcast('openSearchModal', $scope.params.searchInput);
    };

    $scope.openReportModal = function() {
        $log.debug('openReportModal:broadcast');
        $rootScope.$broadcast('openReportModal');
    };

    $scope.openWizard = function() {
        openWizardModal('ProtonMail Wizard', 'startWizard');
    };
});

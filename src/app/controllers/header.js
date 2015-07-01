angular.module("proton.controllers.Header", [])

.controller("HeaderController", function($scope, $state, $stateParams, wizardModal, $rootScope) {

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
        if($scope.searchInput.length > 0) {
            $rootScope.$broadcast('search', $scope.searchInput);
        } else {
            $state.go('secured.inbox');
        }
    };

    $scope.openNewMessage = function() {
        $rootScope.$broadcast('newMessage');
    };

    $scope.openSearchModal = function() {
        $rootScope.$broadcast('openSearchModal', $scope.searchInput);
    };

    $scope.openReportModal = function() {
        $rootScope.$broadcast('openReportModal');
    };

    $scope.openWizard = function() {
        openWizardModal('ProtonMail Wizard', 'startWizard');
    };
});

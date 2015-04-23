angular.module("proton.controllers.Search", [])

.controller("SearchController", function($rootScope, $scope, networkActivityTracker) {
    var modalId = 'searchModal';

    $scope.search = function(fromNavbar) {
        console.log('search');
        console.log($scope.params);
    };

    $scope.open = function() {
        // reset params
        $scope.params = {};
        // show modal
        $('#' + modalId).modal('show');
        // remove dark background modal
        $('body .modal-backdrop').removeClass('in');
    };

    $scope.close = function() {
        // add dark background modal
        $('body .modal-backdrop').removeClass('in');
        // hide modal
        $('#' + modalId).modal('hide');
    };

    $scope.style = function() {
        var display = 'none';

        if($scope.open) {
            display = 'block';
        }

        return {
            display: display
        };
    };

    $rootScope.$on('openSearchModal', function() {
        $scope.open();
    });
});

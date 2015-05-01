angular.module("proton.controllers.Search", ["pikaday"])

.controller("SearchController", function(
    $rootScope,
    $scope,
    networkActivityTracker
) {
    var modalId = 'searchModal';

    $scope.search = function(fromNavbar) {
        console.log('search');
        console.log($scope.params);
        // TODO
        // $scope.params.begin.getDate();
        // $scope.params.end.getDate();
    };

    $scope.open = function() {
        // reset params
        $scope.params.attachments = 2;

        // show modal
        $('#' + modalId).modal('show');
        // remove dark background modal
        $('body .modal-backdrop').removeClass('in');
        // focus on folder select
        $('#search_folder').focus();
    };

    $scope.setMin = function() {
        $scope.params.end.setMinDate($scope.params.begin.getDate());
    };

    $scope.setMax = function() {
        $scope.params.begin.setMaxDate($scope.params.end.getDate());
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

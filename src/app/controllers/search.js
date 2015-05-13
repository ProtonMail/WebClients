angular.module("proton.controllers.Search", ["pikaday"])

.controller("SearchController", function(
    $rootScope,
    $scope,
    $state,
    $stateParams,
    mailboxIdentifiers,
    networkActivityTracker
) {
    var modalId = 'searchModal';

    $scope.folders = mailboxIdentifiers;

    $scope.search = function(navbarValue) {
        var params = {};

        if(angular.isDefined(navbarValue)) {
            // Simple search
            params.words = navbarValue;
        } else {
            // Advanced search
            params.words = '';
            params.from = $scope.params.from;
            params.to = $scope.params.to;
            params.subject = $scope.params.subject;

            if(parseInt($('#search_folder').val()) !== -1) {
                params.location = parseInt($('#search_folder').val());
            }

            if(parseInt($('#search_label').val()) !== 0) {
                params.label = parseInt($('#search_label').val());
            }

            if($scope.params.attachments !== 2) {
                params.attachments = parseInt($scope.params.attachments);
            }

            if($scope.params.starred !== 2) {
                params.starred = parseInt($scope.params.starred);
            }

            if($scope.searchForm.begin.$touched) {
                params.begin = $scope.params.begin.getMoment().unix();
            }

            if($scope.searchForm.end.$touched) {
                params.end = $scope.params.end.getMoment().unix();
            }
        }

        $state.go('secured.search', params);
        $scope.close();
    };

    $scope.open = function() {
        // reset params
        $scope.params.attachments = 2;
        $scope.params.starred = 2;

        // init form
        $scope.searchForm.begin = {};
        $scope.searchForm.end = {};

        // show modal
        $('#' + modalId).modal('show');
        // remove dark background modal
        $('body .modal-backdrop').removeClass('in');
        // focus on folder select
        $('#search_folder').focus();
    };

    $scope.setMin = function() {
        $scope.searchForm.begin.$touched = true; // emulate touched
        $scope.params.end.setMinDate($scope.params.begin.getDate());
    };

    $scope.setMax = function() {
        $scope.searchForm.end.$touched = true; // emulate touched
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

    $rootScope.$on('search', function(event, searchValue) {
        $scope.search(searchValue);
    });
});

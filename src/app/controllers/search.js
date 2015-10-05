angular.module("proton.controllers.Search", ["pikaday", "proton.constants"])

.controller("SearchController", function(
    $rootScope,
    $scope,
    $state,
    $stateParams,
    $timeout,
    authentication,
    CONSTANTS,
    networkActivityTracker
) {
    // Variables
    var modalId = 'searchModal';

    // Listeners
    $scope.$on('searchMessages', function(event, searchValue) {
        $scope.search(searchValue);
    });

    // Methods
    function initParams() {
        var params = {};
        // We re-init each params to remove it in the route
        params.page = undefined;
        params.words = undefined;
        params.from = undefined;
        params.to = undefined;
        params.subject = undefined;
        params.attachments = undefined;
        params.starred = undefined;
        params.begin = undefined;
        params.end = undefined;
        params.location = undefined;
        params.label = undefined;

        return params;
    }

    $scope.search = function(navbarValue) {
        var params = initParams();

        if(angular.isDefined(navbarValue)) {
            // Simple search
            params.words = navbarValue;
        } else {
            // Advanced search
            params.words = $scope.params.words;
            params.from = $scope.params.from;
            params.to = $scope.params.to;
            params.subject = $scope.params.subject;
            params.attachments = parseInt($scope.params.attachments);
            params.starred = parseInt($scope.params.starred);

            if(parseInt($('#search_folder').val()) !== -1) {
                params.location = parseInt($('#search_folder').val());
            }

            if(parseInt($('#search_label').val()) !== 0) {
                params.label = $('#search_label').val();
            }

            if($('#beginDate').val().length > 0) {
                params.begin = $scope.params.begin.getMoment().unix();
            }

            if($('#endDate').val().length > 0) {
                params.end = $scope.params.end.getMoment().unix();
            }
        }

        $state.go('secured.search', params);
        $rootScope.advSearchIsOpen = false;
        $scope.close();
    };

    $scope.open = function(value) {
        $rootScope.advSearchIsOpen = true;
        $scope.labels = authentication.user.Labels;
        // reset params
        $scope.params.attachments = $scope.params.attachments || 2;
        $scope.params.starred = $scope.params.starred || 2;
        $scope.params.words = value || '';

        // init form for date picker
        $scope.searchForm.begin = {};
        $scope.searchForm.end = {};

        // show modal
        $('#' + modalId).modal('show');
        // remove dark background modal
        $('body .modal-backdrop').removeClass('in');
        // focus on folder select
        $('#search_folder').focus();
    };
});

angular.module('proton.search')
    .directive('searchForm', () => {
        return {
            replace: true,
            templateUrl: 'templates/search/searchForm.tpl.html'
        };
    });

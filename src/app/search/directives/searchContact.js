angular.module('proton.search')
    .directive('searchContact', () => {
        return {
            replace: true,
            templateUrl: 'templates/search/searchContact.tpl.html'
        };
    });

angular.module('proton.core')
.directive('paginatorScope', ($timeout) => {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'templates/directives/paginatorScope.tpl.html',
        scope: {
            page: '=',
            totalItems: '=',
            itemsPerPage: '=',
            change: '='
        },
        link(scope) {
            scope.pages = [];

            const disable = function () {
                scope.disableMain = Math.ceil(scope.totalItems / scope.itemsPerPage) === 1 || scope.totalItems === 0; // Main
                scope.disableP = scope.page === 1 || scope.totalItems === 0; // Previous
                scope.disableN = Math.ceil(scope.totalItems / scope.itemsPerPage) === scope.page || scope.totalItems === 0; // Next
            };

            const buildPages = function () {
                let pages;
                const temp = [];

                if ((scope.totalItems % scope.itemsPerPage) === 0) {
                    pages = scope.totalItems / scope.itemsPerPage;
                } else {
                    pages = Math.floor(scope.totalItems / scope.itemsPerPage) + 1;
                }

                for (let i = 1; i <= pages; ++i) {
                    temp.push(i);
                }

                scope.pages = temp;
            };

            scope.$watch('totalItems', () => {
                disable();
                buildPages();
            });

            scope.select = function (p) {
                scope.change(p);
                $timeout(() => {
                    disable();
                }, 0, true);
            };

            scope.next = function () {
                scope.select(scope.page + 1);
            };

            scope.previous = function () {
                scope.select(scope.page - 1);
            };
        }
    };
});

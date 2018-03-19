/* @ngInject */
function paginatorScope(dispatchers) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: require('../../../templates/directives/paginatorScope.tpl.html'),
        scope: {
            page: '=',
            totalItems: '=',
            itemsPerPage: '=',
            change: '='
        },
        link(scope, el, attribute) {
            const { on, unsubscribe } = dispatchers();

            scope.pages = [];

            const disable = () => {
                scope.disableMain = Math.ceil(scope.totalItems / scope.itemsPerPage) === 1 || scope.totalItems === 0; // Main
                scope.disableP = scope.page === 1 || scope.totalItems === 0; // Previous
                scope.disableN = Math.ceil(scope.totalItems / scope.itemsPerPage) === scope.page || scope.totalItems === 0; // Next
            };

            const buildPages = () => {
                let pages;
                const temp = [];

                if (scope.totalItems % scope.itemsPerPage === 0) {
                    pages = scope.totalItems / scope.itemsPerPage;
                } else {
                    pages = Math.floor(scope.totalItems / scope.itemsPerPage) + 1;
                }

                for (let i = 1; i <= pages; ++i) {
                    temp.push(i);
                }

                scope.pages = temp;
            };

            scope.select = (p) => {
                scope.change(p);
                scope.$applyAsync(() => disable());
            };

            scope.next = () => scope.change(scope.page + 1);
            scope.previous = () => scope.change(scope.page - 1);

            scope.$watch('totalItems', () => {
                disable();
                buildPages();
            });

            on('paginatorScope', (e, { type, page }) => {
                if (type === attribute.type) {
                    scope.page = page;
                    disable();
                }
            });

            scope.$on('$destroy', unsubscribe);
        }
    };
}
export default paginatorScope;

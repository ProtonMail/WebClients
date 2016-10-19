angular.module('proton.core')
.directive('paginator', ($rootScope, $stateParams, paginationModel, CONSTANTS) => {

    const { ELEMENTS_PER_PAGE } = CONSTANTS;
    const CLASS_PAGINATOR_DISABLED = 'paginator-disabled-';

    /**
     * Generate a list of classNames based on the current state
     * @param  {$scope} scope  Current scope
     * @return {Function}
     */
    const buildClassNames = (scope) => () => {

        const className = [];

        if (($stateParams.page || 1) === 1) {
            className.push(`${CLASS_PAGINATOR_DISABLED}previous`);
        }

        if (paginationModel.isMax() || scope.totalItems === 0) {
            className.push(`${CLASS_PAGINATOR_DISABLED}next`);
        }

        if (paginationModel.getMaxPage() === 1 || scope.totalItems === 0) {
            className.push(`${CLASS_PAGINATOR_DISABLED}main`);
        }

        return className.join(' ');
    };

    /**
     * Build a list of page where we can go
     * @param  {Number} size Total of data displayable
     * @return {Array}
     */
    const buildPages = (size = ELEMENTS_PER_PAGE) => {
        const total = Math.ceil(size / ELEMENTS_PER_PAGE);
        const value = +$stateParams.page > total ? +$stateParams.page : total;
        return [...new Array(value)].map((a, i) => i + 1);
    };

    /**
     * Switch to previous or next on click
     * @param  {String} key  Key name
     * @return {Function}      EventListener callback
     */
    const onAction = (key) => (e) => (e.preventDefault(), paginationModel[key]());

    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'templates/directives/paginator.tpl.html',
        scope: {
            totalItems: '='
        },
        link(scope, el) {
            scope.pages = [];
            scope.page = $stateParams.page || 1;
            scope.generateClassNames = buildClassNames(scope);

            /**
             * Find the current total of item displayable
             * @todo  RFR we need a consistant way to get the total (cf bidouille buildPages :/)
             * @return {Number}
             */
            const getTotal = () => scope.totalItems || $rootScope.Total;

            const $next = el[0].querySelector('.paginator-btn-next');
            const $previous = el[0].querySelector('.paginator-btn-previous');
            const $dropdown = el[0].querySelector('.paginator-dropdown-list');
            const onNext = onAction('next');
            const onPrevious = onAction('previous');

            const onSelect = (e) => {
                e.preventDefault();
                const { target } = e;

                if (target.classList.contains('paginator-dropdown-item')) {
                    paginationModel.to({ page: +target.getAttribute('data-value') });
                }
            };

            $next.addEventListener('click', onNext, false);
            $previous.addEventListener('click', onPrevious, false);
            $dropdown.addEventListener('click', onSelect, false);

            scope.$watch('totalItems', () => {
                paginationModel.setMaxPage(scope.totalItems);
                scope.pages = buildPages(getTotal());
            });

            scope.$on('$destroy', () => {
                $next.removeEventListener('click', onNext);
                $previous.removeEventListener('click', onPrevious);
                $dropdown.removeEventListener('click', onSelect, false);
            });
        }
    };
});

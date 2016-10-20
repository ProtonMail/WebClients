angular.module('proton.core')
    .directive('storageProgress', (authentication, $filter) => {

        const filter = $filter('humanSize');
        const percentage = $filter('percentage');
        const percentageValue = () => percentage(authentication.user.UsedSpace, authentication.user.MaxSpace);

        return {
            templateUrl: 'templates/directives/core/storageProgress.tpl.html',
            replace: true,
            link(scope) {
                scope.storageStyle = () => ({ width: `${percentageValue()}%` });
                scope.storageValue = () => `${filter(authentication.user.UsedSpace)} / ${filter(authentication.user.MaxSpace)}`;
            }
        };
    });

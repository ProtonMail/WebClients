angular.module('proton.core')
    .directive('placeholderProgress', (authentication, $filter) => {
        const humanSize = $filter('humanSize');
        const percentage = $filter('percentage');
        const percentageValue = () => percentage(authentication.user.UsedSpace, authentication.user.MaxSpace);

        return {
            templateUrl: 'templates/directives/core/placeholderProgress.tpl.html',
            replace: true,
            link(scope) {
                scope.storageStyle = () => ({ width: `${percentageValue()}%` });
                scope.usedSpace = humanSize(authentication.user.UsedSpace);
                scope.maxSpace = humanSize(authentication.user.MaxSpace);
            }
        };
    });

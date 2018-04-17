/* @ngInject */
function sidebarProgress(authentication, organizationModel, $filter) {
    const filter = $filter('humanSize');
    const percentage = $filter('percentage');
    const percentageValue = () => percentage(authentication.user.UsedSpace, authentication.user.MaxSpace);

    return {
        templateUrl: require('../../../templates/directives/core/sidebarProgress.tpl.html'),
        replace: true,
        link(scope) {
            scope.storageStyle = () => ({ width: `${percentageValue()}%` });
            scope.storageValue = () =>
                `${filter(authentication.user.UsedSpace)} / ${filter(authentication.user.MaxSpace)}`;
        }
    };
}
export default sidebarProgress;

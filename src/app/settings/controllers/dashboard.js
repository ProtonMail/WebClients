import _ from 'lodash';

/* @ngInject */
function DashboardController(
    dispatchers,
    $scope,
    $stateParams,
    blackFridayModel,
    methods,
    authentication,
    dashboardConfiguration,
    subscriptionModel,
    blackFridayModalOpener
) {
    const { on, unsubscribe } = dispatchers();

    const scrollToPlans = () => $('.settings').animate({ scrollTop: $('#plans').offset().top }, 1000);
    const updateUser = () => ($scope.isPaidUser = authentication.user.Subscribed);
    const updateMethods = (methods) => ($scope.methods = methods);
    on('updateUser', () => {
        $scope.$applyAsync(() => updateUser());
    });

    if ($stateParams.scroll === true) {
        _.defer(scrollToPlans);
    }

    updateUser();
    updateMethods(methods);

    dashboardConfiguration.set('cycle', $stateParams.cycle || subscriptionModel.cycle());
    dashboardConfiguration.set('currency', $stateParams.currency || subscriptionModel.currency());

    if (blackFridayModel.isDealPeriod() && !$stateParams.noBlackFridayModal) {
        blackFridayModalOpener();
    }

    $scope.$on('$destroy', unsubscribe);
}
export default DashboardController;

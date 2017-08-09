angular.module('proton.settings')
    .controller('DashboardController', ($rootScope, $scope, $stateParams, subscriptionModel) => {
        const scrollToPlans = () => $('.settings').animate({ scrollTop: $('#plans').offset().top }, 1000);
        const updateSubscription = () => $scope.hasPaidMail = subscriptionModel.hasPaid('mail');
        const unsubscribe = $rootScope.$on('subscription', (event, { type }) => {
            (type === 'update') && $scope.$applyAsync(() => updateSubscription());
        });

        if ($stateParams.scroll === true) {
            scrollToPlans();
        }

        updateSubscription();

        $scope.$on('$destroy', () => {
            unsubscribe();
        });
    });

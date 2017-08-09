angular.module('proton.settings')
    .controller('DashboardController', ($rootScope, $scope, $stateParams, methods, subscriptionModel) => {
        const scrollToPlans = () => $('.settings').animate({ scrollTop: $('#plans').offset().top }, 1000);
        const updateSubscription = () => $scope.hasPaidMail = subscriptionModel.hasPaid('mail');
        const updateMethods = (methods) => $scope.methods = methods;
        const unsubscribe = $rootScope.$on('subscription', (event, { type, data = {} }) => {
            (type === 'update') && $scope.$applyAsync(() => updateSubscription(data.subscription));
        });

        if ($stateParams.scroll === true) {
            scrollToPlans();
        }

        updateSubscription(subscriptionModel.get());
        updateMethods(methods);

        $scope.$on('$destroy', () => {
            unsubscribe();
        });
    });

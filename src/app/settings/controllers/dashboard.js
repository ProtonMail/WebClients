angular.module('proton.settings')
    .controller('DashboardController', ($rootScope, $scope, $stateParams, methods, authentication, dashboardConfiguration, subscriptionModel) => {
        const scrollToPlans = () => $('.settings').animate({ scrollTop: $('#plans').offset().top }, 1000);
        const updateUser = () => $scope.isPaidUser = authentication.user.Subscribed;
        const updateMethods = (methods) => $scope.methods = methods;
        const unsubscribe = $rootScope.$on('updateUser', () => {
            $scope.$applyAsync(() => updateUser());
        });

        if ($stateParams.scroll === true) {
            scrollToPlans();
        }

        updateUser();
        updateMethods(methods);
        dashboardConfiguration.set('cycle', subscriptionModel.cycle());
        dashboardConfiguration.set('currency', subscriptionModel.currency());

        $scope.$on('$destroy', () => unsubscribe());
    });

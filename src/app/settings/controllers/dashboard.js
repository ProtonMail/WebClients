angular.module('proton.settings')
    .controller('DashboardController', ($rootScope, $scope, $stateParams, methods, authentication) => {
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

        $scope.$on('$destroy', () => {
            unsubscribe();
        });
    });

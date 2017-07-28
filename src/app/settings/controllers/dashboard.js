angular.module('proton.settings')
.controller('DashboardController', ($stateParams) => {
    const scrollToPlans = () => $('.settings').animate({ scrollTop: $('#plans').offset().top }, 1000);

    if ($stateParams.scroll === true) {
        scrollToPlans();
    }
});

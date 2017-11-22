angular.module('proton.payment', [])
    .config(($httpProvider) => {
        $httpProvider.interceptors.push('paymentsInterceptor');
    });

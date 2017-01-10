angular.module('proton.conversation', [])
.config(($httpProvider) => {
    // Http Intercpetor to check auth failures for xhr requests
    $httpProvider.interceptors.push('conversationsInterceptor');
});

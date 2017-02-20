angular.module('proton.authentication', [
    'proton.constants',
    'proton.settings',
    'proton.models',
    'proton.utils'
])
// Global functions
.run(($rootScope, authentication) => {
    authentication.detectAuthenticationState();
    $rootScope.isLoggedIn = authentication.isLoggedIn();
    $rootScope.isLocked = authentication.isLocked();
    $rootScope.isSecure = authentication.isSecured();
});

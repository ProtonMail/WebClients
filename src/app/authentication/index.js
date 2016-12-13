angular.module('proton.authentication', [
    'proton.constants',
    'proton.models.setting',
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

angular.module('proton.authentication', [
    'proton.constants',
    'proton.utils',
    'proton.settings',
    'proton.keys'
])
// Global functions
.run(($rootScope, authentication) => {
    authentication.detectAuthenticationState();
    $rootScope.isLoggedIn = authentication.isLoggedIn();
    $rootScope.isLocked = authentication.isLocked();
    $rootScope.isSecure = authentication.isSecured();
});

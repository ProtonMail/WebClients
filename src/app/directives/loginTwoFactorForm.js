angular.module('proton.loginTwoFactor', [])
  .directive('loginTwoFactorForm', (authentication, eventManager, cache, cacheCounters) => ({
    replace: true,
    templateUrl: 'templates/directives/loginTwoFactorForm.tpl.html',
    link() {
      // Stop event manager request
      eventManager.stop();
      // Clear cache
      cache.reset();
      cacheCounters.reset();
      // We automatically logout the user when he comes to login page
      authentication.isLoggedIn() && authentication.logout(false);
    }
  }));
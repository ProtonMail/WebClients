angular.module('proton.login', [])
  .directive('loginForm', (authentication, eventManager, cache, cacheCounters) => ({
    replace: true,
    templateUrl: 'templates/directives/loginForm.tpl.html',
    link() {
      // Stop event manager request
      eventManager.stop();
      // Clear cache
      cache.reset();
      cacheCounters.reset();
      // We automatically logout the user when he comes to login page
      authentication.logout(false);
    }
  }));
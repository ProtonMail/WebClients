angular.module('proton.login', [])
  .directive('loginForm', () => ({
      replace: true,
      templateUrl: 'templates/directives/loginForm.tpl.html'
  }));

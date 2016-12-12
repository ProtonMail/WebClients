angular.module('proton.authentication')
  .directive('loginForm', () => ({
      replace: true,
      templateUrl: 'templates/directives/loginForm.tpl.html'
  }));

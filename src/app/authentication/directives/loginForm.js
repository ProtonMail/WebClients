angular.module('proton.authentication')
  .directive('loginForm', () => ({
      replace: true,
      templateUrl: 'templates/authentication/loginForm.tpl.html'
  }));

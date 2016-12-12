angular.module('proton.authentication')
  .directive('loginTwoFactorForm', () => ({
      replace: true,
      templateUrl: 'templates/directives/loginTwoFactorForm.tpl.html'
  }));

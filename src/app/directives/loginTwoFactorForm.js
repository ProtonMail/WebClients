angular.module('proton.loginTwoFactor', [])
  .directive('loginTwoFactorForm', () => ({
      replace: true,
      templateUrl: 'templates/directives/loginTwoFactorForm.tpl.html'
  }));

angular.module('proton.authentication')
  .directive('loginTwoFactorForm', () => ({
      replace: true,
      templateUrl: 'templates/authentication/loginTwoFactorForm.tpl.html'
  }));

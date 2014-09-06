angular.module("proton.Controllers.Contacts", [])

.controller("ContactsController", function($rootScope, $scope, contacts) {
  $rootScope.pageName = "Contacts";
  $scope.contacts = contacts;
  $scope.search = "";
  setTimeout(function () {
    $('input.email').focus();
  }, 10);
});

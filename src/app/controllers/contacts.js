angular.module("proton.Controllers.Contacts", [])

.controller("ContactsController", function($rootScope, $scope, Contact) {
  $rootScope.pageName = "Contacts";
  $scope.contacts = Contact.query();
});

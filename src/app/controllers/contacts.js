angular.module("proton.Controllers.Contacts", [])

.controller("ContactsController", function($rootScope, $scope, contacts, Contact) {
  $rootScope.pageName = "Contacts";

  $scope.contacts = contacts;
  $scope.search = {};
  $scope.editing = false;

  var props;

  $scope.deleteContact = function (contact) {
    if (!confirm("Are you sure you want to delete this contact?")) {
      return;
    }
    var idx = contacts.indexOf(contact);
    if (idx >= 0) {
      contact.$delete();
      contacts.splice(idx, 1);
      Contact.index.updateWith($scope.contacts);
    }
  }
  $scope.setEditedContact = function (contact) {
    props = _.pick(contact, 'ContactName', 'ContactEmail');
    $scope.search = contact;
    $scope.editing = true;
  };
  $scope.cancelEditing = function () {
    _.extend($scope.search, props);
    props = null;
    $scope.search = {};
    $scope.editing = false;
  };
  $scope.saveContact = function () {
    if ($scope.editing) {
      if (this.contactForm.$valid) {
        $scope.search.$update();
        $scope.search = {};
        $scope.editing = false;
        Contact.index.updateWith($scope.contacts);
      }
    } else {
      var existing = _.find(contacts, function (c) {
        return c.ContactEmail === $scope.search.ContactEmail;
      });
      if (this.contactForm.$valid && !existing) {
        var contact = new Contact(_.pick($scope.search, 'ContactName', 'ContactEmail'));
        _.defaults(contact, {ContactName: contact.ContactEmail});

        contact.$save();
        contacts.unshift(contact);
        Contact.index.add([contact]);

        $scope.search = {};
        $scope.editing = false;
      }
    }
  };
});

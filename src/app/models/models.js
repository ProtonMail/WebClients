angular.module("proton.Models", [
  "proton.Auth"
])

.factory("Contact", function($resource, auth) {
  var Contact = $resource()

  return Contact;
})

.factory("Message", function($resource, auth) {
  function Message() {

  }

  return Message;
})

.factory("OutsideMessage", function($resource, auth) {
  function OutsideMessage() {

  }

  return OutsideMessage;
})

.factory("User", function($resource, auth) {
  function User() {

  }

  return User;
})

.factory("UserLevel", function($resource, auth) {
  function UserLevel() {

  }

  return UserLevel;
});

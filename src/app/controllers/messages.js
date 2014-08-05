angular.module("proton.Controllers.Messages", [
  "ngRoute",
  "proton.Routes"
])

.controller("MessageListController", function($route, $routeParams, $scope, $rootScope, mailbox) {
  $rootScope.pageName = _.string.capitalize(mailbox);
})

.controller("ComposeMessageController", function($rootScope) {
  $rootScope.pageName = "New Message";
})

.controller("ViewMessageController", function($rootScope) {

});

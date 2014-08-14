angular.module("proton.Controllers.Messages", [
  "ngRoute",
  "proton.Routes"
])

.controller("MessageListController", function($state, $stateParams, $scope, $rootScope, Message) {
  $rootScope.pageName = $state.current.data.mailbox;
  $scope.messages = Message.query();
})

.controller("ComposeMessageController", function($rootScope) {
  $rootScope.pageName = "New Message";
})

.controller("ViewMessageController", function($rootScope) {

});

angular.module("proton.Controllers.Messages", [
  "proton.Routes"
])

.controller("MessageListController", function($state, $stateParams, $scope, $rootScope, messages) {
  $rootScope.pageName = $state.current.data.mailbox;

  $scope.messages = messages;
  $scope.selectMessage = function (event, message) {
    $state.go("secured.message", { MessageID: message.MessageID });
  };
})

.controller("ComposeMessageController", function($rootScope, $scope, Message) {
  $rootScope.pageName = "New Message";
  $scope.message = new Message();
})

.controller("ViewMessageController", function($rootScope, $scope, message) {
  $rootScope.pageName = message.MessageTitle;
  $scope.message = message;
});

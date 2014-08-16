angular.module("proton.Controllers.Messages", [
  "proton.Routes"
])

.constant("mailboxIdentifiers", {
  "inbox": 0,
  "drafts": 1,
  "sent": 2,
  "trash": 3,
  "spam": 4
})

.controller("MessageListController", function($state, $stateParams, $scope, $rootScope, Message, mailboxIdentifiers) {
  var mailbox = $rootScope.pageName = $state.current.data.mailbox;
  $scope.messages = Message.query({
    "Location": mailboxIdentifiers[mailbox],
    "Tag": (mailbox === 'starred') ? mailbox : undefined,
    "Page": $stateParams.page
  });
})

.controller("ComposeMessageController", function($rootScope, $scope, Message) {
  $rootScope.pageName = "New Message";
  $scope.message = new Message();
})

.controller("ViewMessageController", function($rootScope, $scope, message) {
  $rootScope.pageName = message.MessageTitle;
  $scope.message = message;
});

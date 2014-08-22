angular.module("proton.Controllers.Messages", [
  "proton.Routes"
])

.controller("MessageListController", function(
  $state, 
  $stateParams, 
  $scope, 
  $rootScope, 
  $q,
  messages, 
  networkActivityTracker
) {
  var mailbox = $rootScope.pageName = $state.current.data.mailbox;

  $scope.messages = messages;

  $scope.navigateToMessage = function (event, message) {
    if (!$(event.target).closest("td").hasClass("actions")) {
      $state.go("secured.message", { MessageID: message.MessageID });
    }
  };
  
  $scope.selectAllMessages = function (val) {
    _.forEach($scope.messages, function (message) {
      message.selected = this.allSelected;
    }, this);
  };

  $scope.selectedMessages = function () {
    return _.select($scope.messages, function (message) {
      return message.selected === true;
    });
  };

  $scope.selectedMessagesWithReadStatus = function (bool) {
    return _.select($scope.selectedMessages(), function (message) {
      return message.IsRead == bool;
    });
  };

  $scope.messagesCanBeMovedTo = function (otherMailbox) {
    if (otherMailbox === "inbox") {
      return _.contains(["spam", "trash"], mailbox);
    } else if (otherMailbox == "trash") {
      return _.contains(["inbox", "drafts", "spam", "sent", "starred"], mailbox);
    } else if (otherMailbox == "spam") {
      return _.contains(["inbox", "star red", "trash"], mailbox);
    }
  };

  $scope.setMessagesReadStatus = function (status) {
    networkActivityTracker.track($q.all(
      _.map($scope.selectedMessagesWithReadStatus(!status), function (message) {
        $rootScope.unreadCount = $rootScope.unreadCount + (status ? -1 : 1);
        return message.setReadStatus(status);
      })
    ));
  };

  $scope.moveMessagesTo = function (mailbox) {
    var selectedMessages = $scope.selectedMessages();
    networkActivityTracker.track($q.all(
      _.map(selectedMessages, function (message) {
        if (mailbox == 'delete') {
          return message.delete();
        } else {
          return message.moveTo(mailbox);
        }
      })
    ).then(function () {
      messages = $scope.messages = _.without.apply(_, [messages].concat(selectedMessages));
    }));
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

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
  messageCount,
  messageCache,
  networkActivityTracker
) {
  var mailbox = $rootScope.pageName = $state.current.data.mailbox;

  $scope.page = parseInt($stateParams.page || "1");
  messageCache.setList($scope.messages = messages);
  $scope.messageCount = messageCount.count;

  $scope.selectedFilter = $stateParams.filter;
  $scope.selectedOrder = $stateParams.sort || "-date";

  $scope.hasNextPage = function () {
    return $scope.messageCount > ($scope.page * 25);
  };

  $scope.navigateToMessage = function (event, message) {
    if (!$(event.target).closest("td").hasClass("actions")) {
      $state.go($state.current.name + ".message", { MessageID: message.MessageID });
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
      return _.contains(["inbox", "starred", "trash"], mailbox);
    } else if (otherMailbox == "drafts") {
      return _.contains(["trash"], mailbox);
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
      _.each(selectedMessages, function (message) {
        var i = $scope.messages.indexOf(message);
        if (i >= 0) {
          $scope.messages.splice(i, 1);
        }
      });
    }));
  };

  $scope.filterBy = function (status) {
    $state.go($state.current.name, _.extend({}, $state.params, {filter: status, page: null}));
  };
  
  $scope.clearFilter = function () {
    $state.go($state.current.name, _.extend({}, $state.params, {filter: null, page: null}));
  };

  $scope.orderBy = function (criterion) {
    $state.go($state.current.name, _.extend({}, $state.params, {
      sort: criterion == '-date' ? null : criterion, 
      page: null
    }));
  };

  $scope.goToPage = function (page) {
    if (page > 0 && $scope.messageCount > ((page - 1) * 25)) {
      if (page == 1) {
        page = null;
      }
      
      $state.go($state.current.name, _.extend({}, $state.params, {
        page: page
      }));
    }
  };
})

.controller("ComposeMessageController", function($rootScope, $scope, Message) {
  $rootScope.pageName = "New Message";
  $scope.message = new Message();
})

.controller("ViewMessageController", function(
  $state, 
  $rootScope, 
  $scope,
  $templateCache,
  $compile,
  $timeout,
  message, 
  localStorageService
) {

  $rootScope.pageName = message.MessageTitle;
  $scope.message = message;
  $scope.messageHeadState = "close";

  $scope.toggleHead = function () {
    $scope.messageHeadState = $scope.messageHeadState === "close" ? "open" : "close";
  };

  localStorageService.bind($scope, 'messageHeadState', 'messageHeadState');
  if (!_.contains(["close", "open"], $scope.messageHeadState)) {
    $scope.messageHeadState = "close";
  }

  var render = $compile($templateCache.get("templates/partials/messageContent.tpl.html"));
  var iframe = $("#message-body > iframe");
  var iframeDocument = iframe[0].contentWindow.document;

  // HACK: Makes the iframe's content manipulation work in Firefox.
  iframeDocument.open();
  iframeDocument.close();
  iframe.contents().find("body").append(render($scope));

  // HACK: Lets the iframe render its content before we can get an accurent height measurement.
  $timeout(function () {
    iframe.height(iframeDocument.body.scrollHeight + "px");
  }, 16);
});

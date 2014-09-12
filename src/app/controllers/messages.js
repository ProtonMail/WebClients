angular.module("proton.controllers.Messages", [
  "proton.routes"
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
  var messagesPerPage = $scope.user.NumMessagePerPage;

  var unsubscribe = $rootScope.$on("$stateChangeSuccess", function () {
    $rootScope.pageName = $state.current.data.mailbox;
  });
  $scope.$on("$destroy", unsubscribe);

  $scope.page = parseInt($stateParams.page || "1");
  $scope.messages = messages;

  if ($stateParams.filter) {
    $scope.messageCount = messageCount[$stateParams.filter == 'unread' ? "UnRead" : "Read"];
  } else {
    $scope.messageCount = messageCount.Total;
  }

  $scope.selectedFilter = $stateParams.filter;
  $scope.selectedOrder = $stateParams.sort || "-date";

  messageCache.watchScope($scope, "messages");

  $scope.hasNextPage = function () {
    return $scope.messageCount > ($scope.page * messagesPerPage);
  };

  $scope.navigateToMessage = function (event, message) {
    if (!event || !$(event.target).closest("td").hasClass("actions")) {
      if (message === 'last') {
        message = _.last(messages);
      } else if (message === 'first') {
        message = _.first(messages);
      }

      if ($state.is('secured.drafts')) {
        $state.go("secured.compose", { draft: message.MessageID });
      } else {
        $state.go("secured." + mailbox + ".message", { MessageID: message.MessageID });
      }
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
        return message.setReadStatus(status);
      })
    ));
  };

  $scope.moveMessagesTo = function (mailbox) {
    var selectedMessages = $scope.selectedMessages();
    networkActivityTracker.track($q.all(
      _.map(selectedMessages, function (message) {
        if (mailbox == 'delete') {
          return message.delete().$promise;
        } else {
          return message.moveTo(mailbox).$promise;
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
    if (page > 0 && $scope.messageCount > ((page - 1) * messagesPerPage)) {
      if (page == 1) {
        page = null;
      }
      $state.go($state.current.name, _.extend({}, $state.params, { page: page }));
    }
  };

  $scope.hasAdjacentMessage = function (message, adjacency) {
    if (adjacency === +1) {
      if (messages.indexOf(message) === messages.length - 1) {
        return $scope.hasNextPage();
      } else {
        return true;
      }
    } else if (adjacency === -1) {
      if (messages.indexOf(message) === 0) {
        return $scope.page > 1;
      } else {
        return true;
      }
    }
  };

  $scope.goToAdjacentMessage = function (message, adjacency) {
    var idx = messages.indexOf(message);
    if (adjacency === +1 && idx === messages.length - 1) {
      $state.go("^.relative", {rel: 'first', page: $scope.page + adjacency});
    } else if (adjacency === -1 && messages.indexOf(message) === 0) {
      $state.go("^.relative", {rel: 'last', page: $scope.page + adjacency});
    } else if (Math.abs(adjacency) === 1) {
      $scope.navigateToMessage(null, messages[idx + adjacency]);
    }
  };
})

.controller("ComposeMessageController", function(
  $state,
  $rootScope,
  $scope,
  $stateParams,
  $injector,
  Message,
  message,
  localStorageService,
  attachments,
  crypto,
  networkActivityTracker
) {
  $rootScope.pageName = "New Message";

  $scope.message = message;
  if (!message.MessageBody) {
    $scope.user.$promise.then(function () {
      message.RawMessageBody = "<br><br>" + $scope.user.Signature;
    });
  }
  message.RawMessageBody = message.clearTextBody();

  if (!$scope.message.expirationInHours) {
    $scope.message.expirationInHours = 336;
  }

  if ($stateParams.to) {
    message.RecipientList = $stateParams.to;
  }

  $scope.selectFile = function (files) {
    _.defaults(message, {Attachments: []});
    message.Attachments.push.apply(
      message.Attachments,
      _.map(files, function(file) {
        return attachments.load(file);
      })
    );
  };

  $scope.removeAttachment = function (attachment) {
    var idx = message.Attachments.indexOf(attachment);
    if (idx >= 0) {
      message.Attachments.splice(idx, 1);
    }
  }

  $scope.shouldShowField = function (field) {
    if (_.contains(["BCC", "CC"], field)) {
      return message[field + "List"] || $scope["alwaysShow"+field] == "true";
    }
  };

  $scope.toggleField = function (field) {
    if (_.contains(["BCC", "CC"], field)) {
      if ($scope.shouldShowField(field)) {
        message[field + "List"] = "";
        $scope["alwaysShow"+field] = "false";
      } else {
        $scope["alwaysShow"+field] = "true";
      }
    }
  };

  $scope.toggleConfig = function (config) {
    $scope[config] = !$scope[config];
  }

  $scope.send = function () {
    var newMessage = new Message(_.pick(message, 'MessageTitle', 'RecipientList', 'CCList', 'BCCList', 'PasswordHint'));
    _.defaults(newMessage, {
      RecipientList: '',
      CCList: '',
      BCCList: '',
      MessageTitle: '',
      PasswordHint: '',
      Attachments: []
    });
    if (message.Attachments) {
      newMessage.Attachments = _.map(message.Attachments, function (att) {
        return _.pick(att, 'FileName', 'FileData', 'FileSize', 'MIMEType')
      });
    }
    newMessage.MessageBody = {
      self: crypto.encryptMessageToPackage(message.RawMessageBody, $scope.user.PublicKey),
      outsiders: ''
    };

    emils =  newMessage.RecipientList + (newMessage.CCList == '' ? '' : ','+ newMessage.CCList) + (newMessage.BCCList == '' ? '' : ','+ newMessage.BCCList)
    base64 = crypto.encode_base64(emils);


    var userMessage = new Message();
    networkActivityTracker.track(userMessage.$pubkeys({Emails:base64}).then(function (result) {
      isOutside = false;
      mails = emils.split(",");
      var log = [];
      angular.forEach(mails, function(value) {
        newMessage.MessageBody[value] = crypto.encryptMessageToPackage(message.RawMessageBody, result[value]);
        if(!isOutside)
        {
           if(!value.indexOf('protonmail') < 0)
           {
              isOutside = true;
           }
        }
      });

      if (isOutside) { newMessage.MessageBody['outsiders'] = message.RawMessageBody };

      networkActivityTracker.track(newMessage.$send(null, function (result) {
        $scope.composeForm.$setPristine();
        $state.go("secured.inbox");
      },function(err){}));

    },
    function(err)
    {
      alert(err);
    }));
  }

  $scope.saveDraft = function () {
    var newMessage = new Message(_.pick(message, 'MessageTitle', 'RecipientList', 'CCList', 'BCCList', 'PasswordHint'));

    _.defaults(newMessage, {
      RecipientList: '',
      CCList: '',
      BCCList: '',
      MessageTitle: '',
      PasswordHint: '',
      Attachments: []
    });

    if (message.Attachments) {
      newMessage.Attachments = _.map(message.Attachments, function (att) {
        return _.pick(att, 'FileName', 'FileData', 'FileSize', 'MIMEType')
      });
    }

    newMessage.MessageBody = {
      self: crypto.encryptMessageToPackage(message.RawMessageBody, $scope.user.PublicKey),
      outsiders: ''
    };

    if (message.MessageID) {
      newMessage.MessageID = message.MessageID;
      networkActivityTracker.track(newMessage.$updateDraft(null, function () {
        $scope.composeForm.$setPristine();
      }));
    } else {
      networkActivityTracker.track(newMessage.$saveDraft(null, function (result) {
        message.MessageID = parseInt(result.MessageID);
        $scope.composeForm.$setPristine();
      }));
    }
  }

  $scope.showOptions = false;
  $scope.setOptionsVisibility = function (status) {
    if (!status && $scope.message.IsEncrypted !== '0' &&
        !this.composeForm.enc_password_conf.$valid) {

      $scope.message.IsEncrypted = '0';
    } else {
      $scope.showOptions = status;
    }
  };

  $scope.$watch("composeForm.$pristine", function (isPristine) {
    if (!isPristine) {
      window.onbeforeunload = function () {
        return "By leaving now, you will lose what you have written in this email. " +
               "You can save a draft if you want to come back to it later on.";
      }
    } else {
      window.onbeforeunload = undefined;
    }
  });

  $scope.$watch("message.IsEncrypted", function (newValue, oldValue) {
    if (oldValue === '0' && newValue === '1') {
      $scope.setOptionsVisibility(true);
    } else {
      $scope.setOptionsVisibility(false);
    }
  });

  localStorageService.bind($scope, 'alwaysShowCC', "true");
  localStorageService.bind($scope, 'alwaysShowBCC', "true");
  localStorageService.bind($scope, 'savesDraft', "true");
  localStorageService.bind($scope, 'savesContacts', "true");

  $scope.savesDraft = $scope.savesDraft == 'true';
  $scope.savesContacts = $scope.savesContacts == 'true';
})

.controller("ViewMessageController", function(
  $state,
  $rootScope,
  $scope,
  $templateCache,
  $compile,
  $timeout,
  localStorageService,
  networkActivityTracker,
  message,
  attachments
) {

  $rootScope.pageName = message.MessageTitle;

  $scope.message = message;
  $scope.messageHeadState = "close";
  $scope.showHeaders = false;

  $scope.downloadAttachment = function (attachment) {
    attachments.get(attachment.AttachmentID, attachment.FileName);
  }
  $scope.toggleHead = function () {
    $scope.messageHeadState = $scope.messageHeadState === "close" ? "open" : "close";
  };
  $scope.goToMessageList = function () {
    $state.go("^");
    $rootScope.pageName = $state.current.data.mailbox;
  };
  $scope.moveMessageTo = function (mailbox) {
    networkActivityTracker.track(
      ( (mailbox === 'delete') ? message.delete() : message.moveTo(mailbox) ).$promise
      .then(function () {
        var i = $scope.messages.indexOf(message);
        if (i >= 0) {
          $scope.messages.splice(i, 1);
        }
      })
    );
  };
  $scope.toggleHeaders = function () {
    if ($scope.showHeaders) {
      $scope.showHeaders = false;
    } else {
      $scope.messageHeadState = "open";
      $scope.showHeaders = true;
    }
  };

  if (!message.IsRead) {
    message.setReadStatus(true);
  }

  localStorageService.bind($scope, 'messageHeadState', 'messageHeadState');

  if (!_.contains(["close", "open"], $scope.messageHeadState)) {
    $scope.messageHeadState = "close";
  }

  var render = $compile($templateCache.get("templates/partials/messageContent.tpl.html"));
  var iframe = $("#message-body > iframe");

  iframe.each(function (i) {
    // HACK:
    // Apparently, when navigating from a message to one adjacent, there's a time when there
    // seems to be two iframes living in the DOM, so that the iframe array contains two elements.
    // Problem is, the content of the rendered template can only be put at one place in the DOM,
    // so insert it in the each of these two caused it to be put in only the *second* iframe, which
    // was only there temporarily. So when it disappeared, the content of the rendered template
    // disappeared with it. With this, we force it to be put in the first iframe, which seems to
    // be the right one.
    if (i > 0) {
      return;
    }

    var iframeDocument = this.contentWindow.document;

    // HACK: Makes the iframe's content manipulation work in Firefox.
    iframeDocument.open();
    iframeDocument.close();

    try {
      var content = render($scope);
    } catch(err) {
      console.log(err);
    }

    // Put the rendered template's content in the iframe's body
    $(iframeDocument).find("body").empty().append(content);
  });

  // HACK: Lets the iframe render its content before we try to get an accurate height measurement.
  $timeout(function () {
    iframe.height(iframe[0].contentWindow.document.body.scrollHeight + "px");
  }, 16);
});

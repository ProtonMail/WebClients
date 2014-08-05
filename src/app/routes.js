angular.module("proton.Routes", [
  "ngRoute"
])

.constant("MAILBOXES", [ "drafts", "outbox", "trash", "starred", "spam" ])

.config(function($routeProvider, $locationProvider, MAILBOXES) {

  var fetchMessageList = function($routeParams, $location, $q, Message) {
    var mailbox, page;

    if ($location.path() == "/") {
      mailbox = "inbox";
    } else {
      mailbox = $location.path().split("/")[1];
    }

    page = $routeParams.page;
    if (!page) {
      page = 1;
    }

    return $q.when("!");
    // return Message[mailbox]({page: page});
  };

  var messageListOptions = {
    controller: "MessageListController",
    resolve: {
      mailbox: function(MAILBOXES, $location) {
        return _.find(MAILBOXES, function(mailbox) {
          return $location.path().indexOf(mailbox) == 1;
        }) || "inbox";
      },
      messages: fetchMessageList 
    },
    templateUrl: "templates/messageList.tpl.html"
  };

  var messageListRedirectOptions = {
    redirectTo: function(params, path) {
      if (_.last(path) == "/") {
        return path + "1";
      } else {
        return path + "/1";
      }
    }
  };

  _.each(MAILBOXES, function(box) {
    $routeProvider
      .when("/" + box + "/:page", messageListOptions)
      .when("/" + box, messageListRedirectOptions)
  });

  $routeProvider
    .when("/contacts", {
      controller: "ContactsController",
      templateUrl: "templates/contacts.tpl.html"
    })

    .when("/compose", {
      controller: "ComposeMessageController",
      templateUrl: "templates/compose.tpl.html"
    })

    .when("/login", {
      controller: "LoginController",
      templateUrl: "templates/login.tpl.html"
    })

    .when("/:page", messageListOptions)
    .when("/", messageListRedirectOptions)

    .otherwise({ 
      redirectTo: "/1"
    });

  $locationProvider.html5Mode(true);
});

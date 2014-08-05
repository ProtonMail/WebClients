angular.module("proton.Routes", [
  "ngRoute",
  "proton.Models"
])

.config(function($routeProvider, $locationProvider) {

  var fetchMessageList = function($routeParams, $location, Message) {
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

    return Message[mailbox]({page: page});
  };

  var messageListOptions = {
    controller: "MessageListController",
    resolve: { messages: fetchMessageList },
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

  _.each([ "drafts", "outbox", "trash", "starred", "spam" ], function(box) {
    $routeProvider
      .when("/" + box, messageListRedirectOptions)
      .when("/" + box + "/:page", messageListOptions)
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
      redirectTo: "/" 
    });

  $locationProvider.html5Mode(true);
});

angular.module("proton.Routes", [
  "ui.router",
  "proton.Auth"
])

.constant("MAILBOXES", [ "drafts", "sent", "trash", "starred", "spam" ])

.config(function($stateProvider, $urlRouterProvider, $locationProvider, MAILBOXES) {

  var messageListOptions = function(url, params) {
    var opts = _.extend(params || {}, {
      url: url,
      views: {
        "content@secured": {
          controller: "MessageListController",
          templateUrl: "templates/messageList.tpl.html"
        }
      }
    });
    return opts;
  };

  $stateProvider.state("secured", {
    abstract: true,
    views: {
      "main@": { 
        templateUrl: "templates/layout/secured.tpl.html" 
      }
    },
    templateUrl: "templates/layout/secured.html",
    onEnter: function(authentication, $state) {
      authentication.redirectIfNecessary();
    },
    url: "/secured"
  });

  _.each(MAILBOXES, function(box) {
    $stateProvider
      .state("secured." + box, messageListOptions("/" + box + "?page", {
        data: { mailbox: box }
      }));
  });

  $stateProvider
    .state("secured.inbox", messageListOptions("/inbox?page", {
      data: { mailbox: "inbox" }
    }))

    .state("secured.contacts", {
      url: "/contacts",
      views: {
        "content@secured": { templateUrl: "templates/contacts.tpl.html" }
      },
      controller: "ContactsController"
    })

    .state("secured.compose", {
      url: "/compose",
      views: {
        "content@secured": { templateUrl: "templates/compose.tpl.html" }
      },
      controller: "ComposeMessageController"
    })

    .state("login", {
      url: "/login",
      views: {
        "main@": {
          controller: "LoginController",
          templateUrl: "templates/layout/auth.tpl.html"
        },
        "panel@login": {
          templateUrl: "templates/partials/login-form.tpl.html"
        }
      }
    })

    .state("login.unlock", {
      url: "/unlock",
      controller: "LoginController",
      views: {
        "panel@login": {
          templateUrl: "templates/partials/unlock.tpl.html"
        }
      },
      onEnter: function(authentication, $state) {
        if (!authentication.isLoggedIn()) {
          $state.go("login");
        } else if (!authentication.isLocked()) {
          $state.go("secured.inbox");
        }
      }
    });

  $urlRouterProvider.otherwise(function($injector) {
    var $state = $injector.get("$state");
    var stateName = $injector.get("authentication").state() || "secured.inbox";
    return $state.href(stateName);
  });

  $locationProvider.html5Mode(true);
});

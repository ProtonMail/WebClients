angular.module("proton.Routes", [
  "ui.router",
  "proton.Auth"
])

.constant("MAILBOXES", [
  "drafts",
  "sent",
  "trash",
  "starred",
  "spam"
])

.config(function($stateProvider, $urlRouterProvider, $locationProvider, MAILBOXES) {

  var messageListOptions = function(url, params) {
    var opts = _.extend(params || {}, {
      url: url,
      views: {
        "content@secured": {
          controller: "MessageListController",
          templateUrl: "templates/views/messageList.tpl.html"
        }
      }
    });
    return opts;
  };

  $stateProvider

    // ------------
    // LOGIN ROUTES
    // ------------

    .state("login", {
      url: "/login",
      views: {
        "main@": {
          controller: "LoginController",
          templateUrl: "templates/layout/auth.tpl.html"
        },
        "panel@login": {
          templateUrl: "templates/views/login.tpl.html"
        }
      }
    })

    .state("login.unlock", {
      url: "/unlock",
      controller: "LoginController",
      views: {
        "panel@login": {
          templateUrl: "templates/views/unlock.tpl.html"
        }
      },
      onEnter: function(authentication, $state) {
        if (!authentication.isLoggedIn()) {
          $state.go("login");
        } else if (!authentication.isLocked()) {
          $state.go("secured.inbox");
        }
      }
    })

    // -------------------------------------------
    // SECURED ROUTES
    // this includes everything after login/unlock
    // -------------------------------------------

    .state("secured", {

      // This is included in every secured.* sub-controller

      abstract: true,
      views: {
        "main@": { 
          controller: "SecuredController",
          templateUrl: "templates/layout/secured.tpl.html" 
        }
      },
      url: "/secured",

      onEnter: function(authentication, $state) {

        // This will redirect to a login step if necessary

        authentication.redirectIfNecessary();
      }
    })

    .state("secured.inbox", messageListOptions("/inbox?page", {
      data: {
        mailbox: "inbox"
      }
    }))

    .state("secured.contacts", {
      url: "/contacts",
      views: {
        "content@secured": { 
          templateUrl: "templates/contacts.tpl.html",
          controller: "ContactsController"
        }
      }
    })

    .state("secured.compose", {
      url: "/compose",
      views: {
        "content@secured": { 
          templateUrl: "templates/views/compose.tpl.html",
          controller: "ComposeMessageController"
        }
      }
    })

    .state("secured.settings", {
      url: "/settings",
      views: {
        "content@secured": { 
          templateUrl: "templates/views/settings.tpl.html",
          controller: "SettingsController"
        }
      }
    });

  _.each(MAILBOXES, function(box) {
    $stateProvider.state("secured." + box, messageListOptions("/" + box + "?page", {
      data: { mailbox: box }
    }));
  });

  $urlRouterProvider.otherwise(function($injector) {
    var $state = $injector.get("$state");
    var stateName = $injector.get("authentication").state() || "secured.inbox";
    return $state.href(stateName);
  });

  $locationProvider.html5Mode(true);
});

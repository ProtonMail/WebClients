angular.module("proton.Routes", [
  "ui.router",
  "proton.Auth"
])

.constant("mailboxIdentifiers", {
  "inbox": 0,
  "drafts": 1,
  "sent": 2,
  "trash": 3,
  "spam": 4,
  "starred": undefined
})

.config(function($stateProvider, $urlRouterProvider, $locationProvider, mailboxIdentifiers) {

  var messageListOptions = function(url, params) {
    var opts = _.extend(params || {}, {
      url: url,
      views: {
        "content@secured": {
          controller: "MessageListController",
          templateUrl: "templates/views/messageList.tpl.html"
        }
      },

      resolve: {
        messages: function (Message, mailboxIdentifiers, $state, $stateParams) {
          var mailbox = this.data.mailbox;
          return Message.query({
            "Location": mailboxIdentifiers[mailbox],
            "Tag": (mailbox === 'starred') ? mailbox : undefined,
            "Page": $stateParams.page
          }).$promise;
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

    .state("secured.message", {
      url: "/message/:MessageID",
      views: {
        "content@secured": {
          controller: "ViewMessageController",
          templateUrl: "templates/views/message.tpl.html"
        }
      },
      resolve: {
        message: function (Message, $stateParams) {
          return Message.get(_.pick($stateParams, 'MessageID')).$promise;
        }
      }
    })

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
    })

    // -------------------------------------------
    //  ADMIN ROUTES
    // -------------------------------------------

    .state("admin", {
      url: "/admin",
      views: {
        "main@": {
          controller: "AdminController",
          templateUrl: "templates/layout/admin.tpl.html"
        },
        "content@admin": {
          templateUrl: "templates/views/admin.tpl.html"
        }
      }
    })

    .state("admin.invite", {
      url: "/invite",
      views: {
        "content@admin": {
          templateUrl: "templates/views/admin.invite.tpl.html",
          controller: "AdminController"
        }
      }
    })

    .state("admin.monitor", {
      url: "/monitor",
      views: {
        "content@admin": {
          templateUrl: "templates/views/admin.monitor.tpl.html",
          controller: "AdminController"
        }
      }
    })

    .state("admin.logs", {
      url: "/logs",
      views: {
        "content@admin": {
          templateUrl: "templates/views/admin.logs.tpl.html",
          controller: "AdminController"
        }
      }
    });

  _.each(mailboxIdentifiers, function(id_, box) {
    if (box === 'inbox') {
      return;
    }

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

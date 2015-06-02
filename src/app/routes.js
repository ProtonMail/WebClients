// TODO: inject proton.constants everywhere

angular.module("proton.routes", [
    "ui.router",
    "proton.authentication",
    "proton.constants"
]) 

.config(function($stateProvider, $urlRouterProvider, $locationProvider, CONSTANTS) {

    var messageViewOptions = {
        url: "/:MessageID",
        controller: "ViewMessageController as messageViewCtrl",
        templateUrl: "templates/views/message.tpl.html",
        resolve: {
            message: function(
                $rootScope,
                $state,
                $stateParams,
                Message,
                messageCache,
                authentication,
                networkActivityTracker
            ) {
                if (authentication.isLoggedIn()) {
                    return networkActivityTracker.track(
                        messageCache.get($stateParams.MessageID).$promise
                    );
                }
            }
        }
    };

    var messageParameters = function() {
      var parameters = [
        'page',
        'filter',
        'sort',
        'location',
        'label',
        'from',
        'to',
        'subject',
        'words',
        'begin',
        'end',
        'attachments',
        'starred'
      ];

      return parameters.join('&');
    };

    var messageListOptions = function(url, params) {
        var opts = _.extend(params || {}, {
            url: url + "?" + messageParameters(),
            views: {
                "content@secured": {
                    controller: "MessageListController as messageListCtrl",
                    templateUrl: "templates/views/messageList.tpl.html"
                }
            },

            onEnter: function($rootScope) {
                $rootScope.isInMailbox = true;
            },
            onExit: function($rootScope) {
                $rootScope.isInMailbox = false;
            },

            resolve: {
                messages: function(
                    $state,
                    $stateParams,
                    $rootScope,
                    authentication,
                    Label,
                    Message,
                    CONSTANTS,
                    networkActivityTracker,
                    errorReporter
                ) {
                    var mailbox = this.data.mailbox;

                    if (authentication.isSecured()) {
                        var params = {
                            "Location": CONSTANTS.MAILBOX_IDENTIFIERS[mailbox],
                            "Page": $stateParams.page
                        };

                        // This should replace the starred location when tags are used
                        if (mailbox === 'starred') {
                            params.Tag = mailbox;
                        }

                        if ($stateParams.filter) {
                            params.FilterUnread = +($stateParams.filter === 'unread');
                        } else {
                            params.FilterUnread = -2;
                        }

                        if ($stateParams.sort) {
                            var sort = $stateParams.sort;
                            var desc = _.string.startsWith(sort, "-");
                            if (desc) {
                                sort = sort.slice(1);
                            }

                            params.SortedColumn = _.string.capitalize(sort);
                            params.Order = +desc;
                        }

                        var messagesPromise;

                        if (mailbox === 'search') {
                            params.page = params.Page;
                            messagesPromise = Message.advSearch(_.pick(_.extend(params, $stateParams), 'location', 'label', 'from', 'to', 'subject', 'words', 'begin', 'end', 'attachments', 'starred', 'page')).$promise;
                        } else if(mailbox === 'label') {
                            params.LabelID = $stateParams.label;
                            params.id = $stateParams.label;
                            params.filter = params.FilterUnread;
                            params.sort = params.Order;
                            params.page = params.Page;
                            params = _.pick(params, 'id', 'LabelID', 'filter', 'sort', 'page');
                            messagesPromise = Message.labels(params).$promise;
                        } else {
                            messagesPromise = Message.query(params).$promise;
                        }

                        return networkActivityTracker.track(
                            errorReporter.resolve(
                                "Messages couldn't be queried - please try again later.",
                                messagesPromise, []
                            )
                        );
                    } else {
                        return [];
                    }
                },

                messageCount: function(
                    $stateParams,
                    Message,
                    authentication,
                    CONSTANTS,
                    errorReporter,
                    networkActivityTracker
                ) {
                    var mailbox = this.data.mailbox;
                    if (authentication.isSecured()) {
                        var params = {
                            "Location": CONSTANTS.MAILBOX_IDENTIFIERS[mailbox],
                            "Page": $stateParams.page
                        };

                        // This should replace the starred location when tags are used
                        // if (mailbox === 'starred') {
                        //   params.Tag = mailbox;
                        // }

                        return networkActivityTracker.track(
                            errorReporter.resolve(
                                "Message count couldn't be queried - please try again later.",
                                Message.count(params).$promise, {
                                    count: 0
                                }
                            )
                        );
                    }
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
                templateUrl: "templates/layout/auth.tpl.html"
            },
            "panel@login": {
                controller: "LoginController",
                templateUrl: "templates/views/login.tpl.html"
            }
        }
    })

    .state("login.unlock", {
        url: "/unlock",
        views: {
            "panel@login": {
                controller: "LoginController",
                templateUrl: "templates/views/unlock.tpl.html"
            }
        },
        onEnter: function() {
            setTimeout( function() {
                $('input[name="MailboxPassword"').focus();
            }, 500);
        }
    })

    // -------------------------------------------
    // ACCOUNT ROUTES
    // -------------------------------------------
    .state("account", {
        url: "/account/:username/:token",
        resolve: {
            app: function($stateParams, $state, $q, User) {
                var defer = $q.defer();

                User.checkInvite({
                    username: $stateParams.username,
                    token: $stateParams.token
                }).$promise.then(function(response) {
                    defer.resolve();
                }, function(response) {
                    defer.reject(response);
                });

                return defer.promise;
            }
        },
        views: {
            "main@": {
                controller: "AccountController",
                templateUrl: "templates/layout/auth.tpl.html"
            },
            "panel@account": {
                templateUrl: "templates/views/sign-up.tpl.html"
            }
        }
    })

    .state("signup", {
        url: "/signup",
        views: {
            "main@": {
                controller: "AccountController",
                templateUrl: "templates/layout/auth.tpl.html"
            },
            "panel@signup": {
                templateUrl: "templates/views/sign-up.tpl.html"
            }
        }
    })

    .state("step1", {
        url: "/create/new",
        views: {
            "main@": {
                controller: "AccountController",
                templateUrl: "templates/layout/auth.tpl.html"
            },
            "panel@step1": {
                templateUrl: "templates/views/step1.tpl.html"
            }
        },
        resolve: {
            app: function(authentication, $state, $rootScope) {
                if (authentication.isLoggedIn()) {
                    return authentication.fetchUserInfo().then(
                    function() {
                        $rootScope.pubKey = authentication.user.PublicKey;
                        $rootScope.user = authentication.user;
                        $rootScope.user.DisplayName = authentication.user.addresses[0].Email;
                        if ($rootScope.pubKey === 'to be modified') {
                            $state.go('step2');
                            return;
                        } else {
                            $state.go("login.unlock");
                            return;
                        }
                    });
                }
                else {
                    return;
                }
            }
        }
    })

    .state("step2", {
        url: "/create/mbpw",
        views: {
            "main@": {
                controller: "AccountController",
                templateUrl: "templates/layout/auth.tpl.html"
            },
            "panel@step2": {
                templateUrl: "templates/views/step2.tpl.html"
            }
        },
        onEnter: function(authentication, $state, $rootScope) {
            if (authentication.isLoggedIn()) {
                $rootScope.isLoggedIn = true;
                return authentication.fetchUserInfo().then(
                function() {
                    $rootScope.user = authentication.user;
                    $rootScope.pubKey = authentication.user.PublicKey;
                    $rootScope.user.DisplayName = authentication.user.addresses[0].Email;
                    if ($rootScope.pubKey === 'to be modified') {
                        return;
                    } else {
                        $state.go("login.unlock");
                        return;
                    }
                });
            }
            else {
                $state.go("login");
                return;
            }
        }
    })

    .state("reset", {
        url: "/reset",
        views: {
            "main@": {
                controller: "AccountController",
                templateUrl: "templates/layout/auth.tpl.html"
            },
            "panel@reset": {
                templateUrl: "templates/views/reset.tpl.html"
            }
        }
    })

    // -------------------------------------------
    // SUPPORT ROUTES
    // -------------------------------------------
    .state("support", {
        url: "/support",
        views: {
            "main@": {
                controller: "SupportController",
                templateUrl: "templates/layout/auth.tpl.html"
            }
        }
    })

    .state("support.message", {
        params: {
            data: null
        }, // Tip to avoid passing parameters in the URL
        url: "/message",
        onEnter: function($state, $stateParams) {
            if ($stateParams.data === null) {
                $state.go('login');
            }
        },
        views: {
            "panel@support": {
                templateUrl: "templates/views/support-message.tpl.html"
            }
        }
    })

    .state("support.reset-password", {
        url: "/reset-password",
        views: {
            "panel@support": {
                templateUrl: "templates/views/reset-password.tpl.html"
            }
        }
    })

    .state("support.confirm-new-password", {
        url: "/confirm-new-password/:token",
        onEnter: function($stateParams, $state, User) {
            var token = $stateParams.token;

            // Check if reset token is valid
            User.checkResetToken({
                token: token
            }).$promise.catch(function(result) {
                if (result.error) {
                    $state.go("support.message", {
                        data: {
                            title: result.error,
                            content: result.error_description,
                            type: "alert-danger"
                        }
                    });
                }
            });
        },
        views: {
            "panel@support": {
                templateUrl: "templates/views/confirm-new-password.tpl.html"
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
        // url: "/secured", // remove

        resolve: {
            // Contains also labels and contacts
            user: function(authentication) {
                return authentication.fetchUserInfo();
            }
        },

        onEnter: function(authentication, $state) {
            // This will redirect to a login step if necessary
            authentication.redirectIfNecessary();
        }
    })

    .state("secured.inbox", messageListOptions("/inbox", {
        data: {
            mailbox: "inbox"
        }
    }))

    .state("secured.inbox.relative", {
        url: "/{rel:first|last}",
        controller: function($scope, $stateParams) {
            $scope.navigateToMessage(null, $stateParams.rel);
        }
    })

    .state("secured.inbox.message", _.clone(messageViewOptions))

    .state("secured.inbox.print", _.extend(_.clone(messageViewOptions), {
        url: "/print/:MessageID",
        onEnter: function($rootScope) { $rootScope.isBlank = true; },
        onExit: function($rootScope) { $rootScope.isBlank = true; },
        views: {
            "main@": {
                controller: "ViewMessageController",
                templateUrl: "templates/views/message.print.tpl.html"
            }
        }
    }))

    .state("secured.inbox.raw", _.extend(_.clone(messageViewOptions), {
        url: "/raw/:MessageID",
        onEnter: function($rootScope) { $rootScope.isBlank = true; },
        onExit: function($rootScope) { $rootScope.isBlank = true; },
        views: {
            "main@": {
                controller: "ViewMessageController",
                templateUrl: "templates/views/message.raw.tpl.html"
            }
        }
    }))

    .state("secured.contacts", {
        url: "/contacts",
        views: {
            "content@secured": {
                templateUrl: "templates/views/contacts.tpl.html",
                controller: "ContactsController"
            }
        },
        resolve: {
            contacts: function(Contact, networkActivityTracker) {
                return networkActivityTracker.track(
                    Contact.query().$promise
                );
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

    .state("secured.labels", {
        url: "/labels",
        views: {
            "content@secured": {
                templateUrl: "templates/views/labels.tpl.html",
                controller: "SettingsController"
            }
        }
    })

    .state("secured.security", {
        url: "/security",
        views: {
            "content@secured": {
                templateUrl: "templates/views/security.tpl.html",
                controller: "SettingsController"
            }
        }
    })

    .state("secured.theme", {
        url: "/theme",
        views: {
            "content@secured": {
                templateUrl: "templates/views/theme.tpl.html",
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

    _.each(CONSTANTS.MAILBOX_IDENTIFIERS, function(id_, box) {
        if (box === 'inbox') {
            return;
        }

        var stateName = "secured." + box;
        $stateProvider.state(stateName, messageListOptions("/" + box, {
            data: {
                mailbox: box
            }
        }));

        $stateProvider.state("secured." + box + ".message", _.clone(messageViewOptions));
    });

    $urlRouterProvider.otherwise(function($injector) {
        var $state = $injector.get("$state");
        var stateName = $injector.get("authentication").state() || "secured.inbox";
        return $state.href(stateName);
    });

    $locationProvider.html5Mode(true);
})

.run(function($rootScope, $state) {
    $rootScope.go = _.bind($state.go, $state);
});

angular.module("proton.routes", [
    "ui.router",
    "proton.authentication",
    "proton.constants"
])

.config(function($stateProvider, $urlRouterProvider, $locationProvider, CONSTANTS) {

    var messageViewOptions = {
        url: "/:id",
        views: {
            "content@secured": {
                controller: "ViewMessageController as messageViewCtrl",
                templateUrl: "templates/views/message.tpl.html"
            }
        },
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
                        messageCache.get($stateParams.id).$promise
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
        'starred',
        'reload'
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
                templateUrl: "templates/layout/login.tpl.html"
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
        onEnter: function($rootScope, $state, authentication, $log) {
            if ($rootScope.TemporaryEncryptedPrivateKeyChallenge===undefined) {
                $log.debug('login.unlock.onEnter:1');
                $rootScope.isLoggedIn = false;
                authentication.logout();
                $state.go('login');
            }
            setTimeout( function() {
                $( "[type=password]" ).focus();
            }, 200);
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

    // DISBALED FOR NOW :)
    .state("signup", {
        url: "/signup",
        views: {
            "main@": {
                controller: "SignupController",
                templateUrl: "templates/layout/auth.tpl.html"
            },
            "panel@signup": {
                templateUrl: "templates/views/sign-up.tpl.html"
            }
        },
        onEnter: function($rootScope, $state) {
            if ($rootScope.allowedNewAccount!==true) {
                $state.go('login');
            }
        }
    })

    .state("pre-invite", {
        url: "/pre-invite/:user/:token",
        views: {
            "main@": {
                templateUrl: "templates/layout/pre.tpl.html"
            }
        },
        resolve: {
            validate: function($http, url, CONFIG, $state, $stateParams, $rootScope, notify) {
                $http.post(
                    url.get() + "/users/" + $stateParams.token + "/check",
                    {Username: $stateParams.user}
                )
                .then(
                    function( response) {
                        if (response.data.Valid===1) {
                            $rootScope.allowedNewAccount = true;
                            $rootScope.inviteToken = $stateParams.token;
                            $rootScope.preInvited = true;
                            $rootScope.username = $stateParams.user;
                            $state.go('signup');
                            return;
                        }
                        else {
                            notify({
                                message: "Invalid Invite Link.",
                                classes: "notification-danger"
                            });
                            $state.go('login');
                            return;
                        }
                    }
                );
            }
        }
    })

    .state("step1", {
        url: "/create/new",
        views: {
            "main@": {
                controller: "SignupController",
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
        },
        onEnter: function($rootScope, $state) {
            if ($rootScope.allowedNewAccount!==true) {
                $state.go('login');
            }
        }
    })

    .state("step2", {
        url: "/create/mbpw",
        views: {
            "main@": {
                controller: "SignupController",
                templateUrl: "templates/layout/auth.tpl.html"
            },
            "panel@step2": {
                templateUrl: "templates/views/step2.tpl.html"
            }
        },
        onEnter: function(authentication, $state, $rootScope, $log) {
            if ($rootScope.allowedNewAccount!==true) {
                $state.go('login');
            }
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
                $log.debug('step2.onEnter:1');
                $state.go('login');
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
        },
        resolve: {
            token: function($http, $rootScope, authentication, url, CONFIG) {
                return $http.post(url.get() + "/auth",
                    _.extend(_.pick($rootScope.creds, "Username", "Password", "HashedPassword"), {
                        ClientID: CONFIG.clientID,
                        ClientSecret: CONFIG.clientSecret,
                        GrantType: "password",
                        State: authentication.randomString(24),
                        RedirectURI: "https://protonmail.ch",
                        ResponseType: "token",
                        Scope: "reset"
                    })
                );
            }
        },
        onEnter: function($rootScope, $state, $log) {
            if ($rootScope.TemporaryAccessData===undefined) {
                $log.debug('reset.onEnter:1');
                $state.go('login');
                return;
            }
        }
    })

    // -------------------------------------------
    // UPGRADE ROUTES
    // -------------------------------------------
    .state("upgrade", {
        url: "/upgrade",
        views: {
            "main@": {
                templateUrl: "templates/layout/auth.tpl.html"
            },
            "panel@upgrade": {
                controller: "UpgradeController",
                templateUrl: "templates/views/upgrade.tpl.html"
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
        onEnter: function($stateParams, $state, Reset) {
            var token = $stateParams.token;

            // Check if reset token is valid
            Reset.validateResetToken({
                token: token
            }).then(
                function(response) {
                    // console.log(response.data);
                    if (response.data.Error) {
                        $state.go("support.message", {
                            data: {
                                title: response.data.Error,
                                content: response.data.Error,
                                type: "alert-danger"
                            }
                        });
                    }
                },
                function() {
                    $state.go("support.message", {
                        data: {
                            title: 'Reset Error',
                            content: 'Sorry, we are unable to reset your password right now. Please try the link again in a few minutes.',
                            type: "alert-danger"
                        }
                    });
                }
            );
        },
        views: {
            "panel@support": {
                templateUrl: "templates/views/confirm-new-password.tpl.html"
            }
        }
    })

    .state("support.reset-mailbox", {
        url: "/reset-mailbox/:token",
        onEnter: function($stateParams, $state, $rootScope, authentication) {
            $rootScope.resetMailboxToken = $stateParams.token;
            if (!!!authentication.isLoggedIn()) {
                event.preventDefault();
                $state.go('login');
            }
            else {
                $state.go('reset');
            }
        },
        views: {
            "panel@support": {
                templateUrl: "templates/views/confirm-new-password.tpl.html"
            }
        }
    })

    // -------------------------------------------
    // ENCRYPTION OUTSIDE
    // -------------------------------------------
    .state("eo", {
        abstract: true,
        views: {
            "main@": {
                templateUrl: "templates/layout/outside.tpl.html"
            }
        }
    })

    .state("eo.unlock", {
        url: "/eo/:tag",
        resolve: {
            encryptedToken: function(Eo, $stateParams) {
                return Eo.token($stateParams.tag);
            }
        },
        views: {
            "content": {
                templateUrl: "templates/views/outside.unlock.tpl.html",
                controller: function($scope, $state, $stateParams, pmcw, encryptedToken, networkActivityTracker, notify) {
                    $scope.params = {};
                    $scope.params.MessagePassword = '';

                    if(encryptedToken.data.Error) {
                        $scope.tokenError = true;
                    } else {
                        $scope.tokenError = false;
                        encryptedToken = encryptedToken.data.Token;
                    }

                    $scope.unlock = function() {
                        var promise = pmcw.decryptMessage(encryptedToken, $scope.params.MessagePassword);

                        promise.then(function(decryptedToken) {
                            window.sessionStorage["proton:decrypted_token"] = decryptedToken;
                            window.sessionStorage["proton:encrypted_password"] = pmcw.encode_utf8_base64($scope.params.MessagePassword);
                            $state.go('eo.message', {tag: $stateParams.tag});
                        }, function(error) {
                            notify({message: error, classes: 'notification-danger'});
                        });
                    };
                }
            }
        }
    })

    .state("eo.message", {
        url: "/eo/message/:tag",
        resolve: {
            message: function($stateParams, $q, Eo, Message, pmcw) {
                var deferred = $q.defer();
                var token_id = $stateParams.tag;
                var decrypted_token = window.sessionStorage["proton:decrypted_token"];
                var password = pmcw.decode_utf8_base64(window.sessionStorage["proton:encrypted_password"]);

                Eo.message(decrypted_token, token_id)
                .then(function(result) {
                    var message = result.data.Message;
                    var promises = [];

                    promises.push(pmcw.decryptMessageRSA(message.Body, password, message.Time).then(function(body) {
                        message.Body = body;
                    }));

                    _.each(message.Replies, function(reply) {
                        promises.push(pmcw.decryptMessageRSA(reply.Body, password, reply.Time).then(function(body) {
                            reply.Body = body;
                        }));
                    });

                    $q.all(promises).then(function() {
                        message.displayMessage = true;
                        deferred.resolve(new Message(message));
                    });
                });

                return deferred.promise;
            }
        },
        views: {
            "content": {
                controller: "OutsideController",
                templateUrl: "templates/views/outside.message.tpl.html"
            }
        }
    })

    .state("eo.reply", {
        url: "/eo/reply/:tag",
        resolve: {
            message: function($stateParams, $q, Eo, Message, pmcw) {
                var deferred = $q.defer();
                var token_id = $stateParams.tag;
                var decrypted_token = window.sessionStorage["proton:decrypted_token"];
                var password = pmcw.decode_utf8_base64(window.sessionStorage["proton:encrypted_password"]);

                Eo.message(decrypted_token, token_id)
                .then(
                    function(result) {
                        var message = result.data.Message;
                        message.publicKey = result.data.PublicKey;
                        pmcw.decryptMessageRSA(message.Body, password, message.Time)
                        .then(
                            function(body) {
                                message.Body = '<br /><br /><blockquote>' + body + '</blockquote>';
                                message.Attachments = [];
                                message.replyMessage = true;
                                deferred.resolve(new Message(message));
                            })
                        ;
                    }
                );

                return deferred.promise;
            }
        },
        views: {
            "content": {
                controller: "OutsideController",
                templateUrl: "templates/views/outside.reply.tpl.html"
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
        resolve: {
            // Contains also labels and contacts
            user: function(authentication, $log, $http, pmcw) {
                $log.debug('user:resolve:');
                if(angular.isDefined(authentication.user) && authentication.user) {
                    return authentication.user;
                }
                else {
                    $log.debug('user:resolve:fetchUserInfo');
                    $log.debug(window.sessionStorage.getItem(CONSTANTS.OAUTH_KEY+':SessionToken'));
                    if (window.sessionStorage.getItem(CONSTANTS.OAUTH_KEY+':SessionToken')!==undefined) {
                        $http.defaults.headers.common["x-pm-session"] = pmcw.decode_base64(window.sessionStorage.getItem(CONSTANTS.OAUTH_KEY+':SessionToken'));
                    }
                    return authentication.fetchUserInfo(); // TODO need to rework this just for the locked page
                }
            }
        },
        onEnter: function(authentication, $state, $log) {
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

    .state("secured.print", _.extend(_.clone(messageViewOptions), {
        url: "/print/:id",
        onEnter: function($rootScope) { $rootScope.isBlank = true; },
        onExit: function($rootScope) { $rootScope.isBlank = false; },
        views: {
            "main@": {
                controller: "ViewMessageController",
                templateUrl: "templates/views/message.print.tpl.html"
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
                    Contact.get()
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

    .state("secured.themeReset", {
        url: "/theme-reset",
        views: {
            "content@secured": {
                templateUrl: "templates/views/theme-reset.tpl.html",
                controller: "SettingsController"
            }
        },
        onEnter: function(Setting, user, $state) {
            Setting.theme({
              "Theme": ''
            }).$promise.then(
                function(response) {
                    user.Theme = '';
                    $state.go('secured.inbox');
                    return;
                },
                function(response) {
                    $state.go('secured.inbox');
                    return;
                }
            );
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

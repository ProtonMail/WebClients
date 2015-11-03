angular.module("proton.controllers.Print", ["proton.constants"])

.controller("PrintController", function(
    $compile,
    $filter,
    $interval,
    $log,
    $q,
    $rootScope,
    $sce,
    $scope,
    $state,
    $stateParams,
    $templateCache,
    $timeout,
    $translate,
    alertModal,
    attachments,
    authentication,
    cacheMessages,
    confirmModal,
    CONSTANTS,
    Label,
    Message,
    networkActivityTracker,
    notify,
    pmcw,
    tools,
    message
) {

    $scope.message = message;

    $scope.initView = function() {
        if($scope.message.IsRead === 0) {
            $scope.message.IsRead = 1;
            Message.read({IDs: [$scope.message.ID]});
            // TODO generate event
        }

        if(angular.isDefined($scope.message.Body)) {
            $scope.displayContent();
        } else {
            cacheMessages.getMessage($scope.message.ID).then(function(message) {
                _.extend($scope.message, message);
                $scope.displayContent();
            });
        }

        // start timer ago
        $scope.agoTimer = $interval(function() {
            var time = $filter('longReadableTime')($scope.message.Time);

            $scope.ago = time;
        }, 1000);

        $scope.message.expand = true;
    };

    $scope.getLabel = function(id) {
        return _.findWhere($scope.labels, {ID: id});
    };
    
    $scope.displayContent = function(print) {
        var whitelist = ['notify@protonmail.com'];

        if (whitelist.indexOf($scope.message.Sender.Address) !== -1 && $scope.message.IsEncrypted === 0) {
            $scope.message.imagesHidden = false;
        } else if(authentication.user.ShowImages === 1) {
            $scope.message.imagesHidden = false;
        }

        $scope.message.clearTextBody().then(function(result) {
            var showMessage = function(content) {
                if(print !== true) {
                    content = $scope.message.clearImageBody(content);
                }

                // safari warning
                if(!$rootScope.isFileSaverSupported) {
                    $scope.safariWarning = true;
                }

                content = DOMPurify.sanitize(content, {
                    ADD_ATTR: ['target'],
                    FORBID_TAGS: ['style', 'input', 'form']
                });

                // for the welcome email, we need to change the path to the welcome image lock
                content = content.replace("/img/app/welcome_lock.gif", "/assets/img/emails/welcome_lock.gif");

                if (tools.isHtml(content)) {
                    $scope.isPlain = false;
                } else {
                    $scope.isPlain = true;
                }

                $scope.content = $sce.trustAsHtml(content);

                // broken images
                $("img").error(function () {
                    $(this).unbind("error").addClass("pm_broken");
                });

                if(print) {
                    setTimeout(function() {
                        window.print();
                    }, 1000);
                }
            };

            // PGP/MIME
            if ( $scope.message.IsEncrypted === 8 ) {

                var mailparser = new MailParser({
                    defaultCharset: 'UTF-8'
                });

                mailparser.on('end', function(mail) {
                    var content;

                    if (mail.html) {
                        content = mail.html;
                    } else if (mail.text) {
                        content = mail.text;
                    } else {
                        content = "Empty Message";
                    }

                    if (mail.attachments) {
                        content = "<div class='alert alert-danger'><span class='pull-left fa fa-exclamation-triangle'></span><strong>PGP/MIME Attachments Not Supported</strong><br>This message contains attachments which currently are not supported by ProtonMail.</div><br>"+content;
                    }

                    $scope.$evalAsync(function() { showMessage(content); });
                });

                mailparser.write(result);
                mailparser.end();
            } else {
                $scope.$evalAsync(function() { showMessage(result); });
            }
        }, function(err) {
            $scope.togglePlainHtml();
            //TODO error reporter?
            $log.error(err);
        });
    };

    $scope.initView();

});

angular.module("proton.controllers.Outside", [
    "proton.routes",
    "proton.constants"
])

.controller("OutsideController", function(
    $rootScope,
    $scope,
    $state,
    $stateParams,
    $q,
    authentication,
    CONSTANTS,
    networkActivityTracker,
    notify,
    pmcw,
    encryptedToken,
    token,
    message
) {    
    $scope.unlock = function() {
        var promise = pmcw.decryptMessage(encryptedToken, $scope.MessagePassword);

        promise.then(function(decryptToken) {
            window.sessionStorage["proton:encrypted_password"] = $scope.MessagePassword;

            deferred.resolve(result);
        });

        networkActivityTracker.track(promise);
    };

    $scope.toggleImages = function() {
        message.toggleImages();
    };

    $scope.displayContent = function() {
        message.clearTextBody().then(function(result) {
            var content = message.clearImageBody(result);

            content = tools.replaceLineBreaks(content);
            content = DOMPurify.sanitize(content, {
                FORBID_TAGS: ['style']
            });

            if (tools.isHtml(content)) {
                $scope.isPlain = false;
            } else {
                $scope.isPlain = true;
            }

            $scope.content = $sce.trustAsHtml(content);

            $timeout(function() {
                tools.transformLinks('message-body');
            });
        });
    };

    $scope.reply = function() {
        $state.go('eo.reply');
    };

    $scope.send = function(message) {
        var deferred = $q.defer();
        var parameters = {};
        var emails = message.emailsToString();

        parameters.id = message.ID;

        message.getPublicKeys(emails).then(function(result) {
            var keys = result;
            var outsiders = false;
            var promises = [];

            parameters.Packages = [];

            _.each(emails, function(email) {
                if(keys[email].length > 0) { // inside user
                    var key = keys[email];

                    promises.push(message.encryptBody(key).then(function(result) {
                        var body = result;

                        message.encryptPackets(authentication.user.PublicKey).then(function(result) {
                            var keyPackets = result;

                            return parameters.Packages.push({Address: email, Type: 1, Body: body, KeyPackets: keyPackets});
                        });
                    }));
                } else { // outside user
                    outsiders = true;

                    if(message.IsEncrypted === 1) {
                        // TODO
                        // var replyToken = generateReplyToken();
                        // var encryptedReplyToken = pmcrypto.encryptMessage(replyToken, [], message.Password);

                        promises.push(message.encryptBody(message.Password).then(function(result) {
                            var body = result;

                            message.encryptPackets(message.Password).then(function(result) {
                                var keyPackets = result;

                                return parameters.Packages.push({Address: email, Type: 2, Body: result, KeyPackets: keyPackets, PasswordHint: message.PasswordHint});
                            });
                        }));
                    }
                }
            });

            if(outsiders === true && message.IsEncrypted === 0) {
                parameters.AttachmentKeys = [];
                parameters.ClearBody = message.Body;

                if(message.Attachments.length > 0) {
                    parameters.AttachmentKeys = message.clearPackets();
                }
            }

            $q.all(promises).then(function() {
                Message.send(parameters).$promise.then(function(result) {
                    notify($translate.instant('MESSAGE_SENT'));
                    deferred.resolve(result);
                });
            });
        });

        message.track(deferred.promise);

        return deferred.promise;
    };
});

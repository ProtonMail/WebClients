angular.module("proton.controllers.Outside", [
    "proton.routes",
    "proton.constants"
])

.controller("OutsideController", function(
    $rootScope,
    $scope,
    $state,
    $stateParams,
    authentication,
    CONSTANTS,
    networkActivityTracker,
    notify
) {
    $scope.unlock = function() {
        $state.go('eo.message');
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

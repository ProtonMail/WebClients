angular.module("proton.controllers.Outside", [
    "proton.routes",
    "proton.constants"
])

.controller("OutsideController", function(
    $scope,
    $timeout,
    $state,
    $stateParams,
    $q,

    authentication,
    Message,
    tools,
    pmcw,
    attachments,
    Eo,

    message
) {
    $scope.message = message;

    var decrypted_token = window.sessionStorage["proton:decrypted_token"];
    var password = pmcw.decode_utf8_base64(window.sessionStorage["proton:encrypted_password"]);
    var token_id = $stateParams.tag;

    if(message.displayMessage === true) {
        $timeout(function() {
            $scope.message.Body = $scope.clean($scope.message.Body);
            $scope.containsImage = tools.containsImage($scope.message.Body);
            _.each($scope.message.Replies, function(reply) {
                reply.Body = $scope.clean(reply.Body);
            });
            tools.transformLinks('message-body');
        });
    }

    $scope.send = function() {
        Message.getPublicKeys(message.SenderAddress).then(function(keys) {
            var publicKey = keys[message.SenderAddress];
            var bodyPromise = pmcw.encryptMessage($scope.message.Body, publicKey);
            var replyBodyPromise = pmcw.encryptMessage($scope.message.Body, password);

            $q.all({Body: bodyPromise, ReplyBody: replyBodyPromise}).then(function(result) {
                var data = {
                    'Body': result.Body,
                    'ReplyBody': result.ReplyBody,
                    'Filename[]': [], // TODO
                    'MIMEType[]': [], // TODO
                    'KeyPackets[]': [], // TODO
                    'DataPacket[]': [] // TODO
                };

                Eo.reply(decrypted_token, token_id, data);
            });
        });
    };

    $scope.cancel = function() {
        $state.go('eo.message', {tag: $stateParams.tag});
    };


    $scope.clean = function(body) {
        var content = angular.copy(body);

        content = tools.clearImageBody(content);
        $scope.imagesHidden = true;
        content = tools.replaceLineBreaks(content);
        content = DOMPurify.sanitize(content, { FORBID_TAGS: ['style'] });

        return content;
    };

    $scope.reply = function() {
        $state.go('eo.reply', {tag: $stateParams.tag});
    };

    $scope.toggleImages = function() {
        if($scope.imagesHidden === true) {
            $scope.message.Body = tools.fixImages($scope.message.Body);
            $scope.imagesHidden = false;
        } else {
            $scope.message.Body = tools.breakImages($scope.message.Body);
            $scope.imagesHidden = true;
        }
    };

    $scope.selectFile = function() {
        $('#dropzone').click();
    };

    $scope.decryptAttachment = function(attachment, $event) {
        if (attachment.decrypted===true) {
            return true;
        }

        attachment.decrypting = true;

        var deferred = $q.defer();

        // decode key packets
        var keyPackets = pmcw.binaryStringToArray(pmcw.decode_base64(attachment.KeyPackets));

        // get enc attachment
        var att = Eo.attachment(decrypted_token, token_id, attachment.ID);

        // decrypt session key
        var key = pmcw.decryptSessionKey(keyPackets, password);

        // when we have the session key and attachent:
        $q.all({
            "attObject": att,
            "key": key
         }).then(
            function(obj) {
                // create new Uint8Array to store decryted attachment
                var at = new Uint8Array(obj.attObject.data);

                // grab the key
                var key = obj.key.key;

                // grab the algo
                var algo = obj.key.algo;

                // decrypt the att
                pmcw.decryptMessage(at, key, true, algo).then(
                    function(decryptedAtt) {
                        var blob = new Blob([decryptedAtt.data], {type: attachment.MIMEType});
                        if(navigator.msSaveOrOpenBlob || URL.createObjectURL!==undefined) {
                            // Browser supports a good way to download blobs
                            $scope.$apply(function() {
                                attachment.decrypting = false;
                                attachment.decrypted = true;
                            });

                            var href = URL.createObjectURL(blob);

                            $this = $($event.target);
                            $this.attr('href', href);
                            $this.attr('target', '_blank');
                            $this.attr('download', attachment.Name);
                            $this.triggerHandler('click');

                            deferred.resolve();
                        }
                        else {
                            // Bad blob support, make a data URI, don't click it
                            var reader = new FileReader();

                            reader.onloadend = function () {
                                link.attr('href', reader.result);
                            };

                            reader.readAsDataURL(blob);
                        }
                    },
                    function(error) {
                        console.log(error);
                    }
                );
            },
            function(err) {
                console.log(err);
            }
        );
    };
});

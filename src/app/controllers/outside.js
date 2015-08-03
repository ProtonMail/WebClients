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
    $translate,
    $log,
    authentication,
    Message,
    tools,
    pmcw,
    attachments,
    Eo,
    CONSTANTS,
    notify,

    message
) {
    $scope.message = message;

    var decrypted_token = window.sessionStorage["proton:decrypted_token"];
    var password = pmcw.decode_utf8_base64(window.sessionStorage["proton:encrypted_password"]);
    var token_id = $stateParams.tag;
    var Filename = [];
    var MIMEType = [];
    var KeyPackets = [];
    var DataPacket = [];

    // $log.debug($scope.message.publicKey);

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

    $timeout(function() {
        $('#inputFile').change(function(event) {
            event.preventDefault();

            var files = $('#inputFile')[0].files;
            var file_array = [];

            for(var i = 0; i<files.length; i++) {
                file_array.push(files[i]);
            }

            $scope.addAttachment(file_array);
        });
    }, 100);

    $scope.selectFile = function() {
        $('#inputFile').click();
    };

    $scope.send = function() {
        var publicKey = $scope.message.publicKey;
        $log.debug(publicKey);
        $log.debug('$scope.message',$scope.message);
        $log.debug('message',message);
        var bodyPromise = pmcw.encryptMessage($scope.message.Body, $scope.message.publicKey);
        $log.debug('b');
        var replyBodyPromise = pmcw.encryptMessage($scope.message.Body, [], password);
        $log.debug('c');

        $q.all({
            Body: bodyPromise,
            ReplyBody: replyBodyPromise
        })
        .then(
            function(result) {

                $log.debug('d');

                var data = {
                    'Body': result.Body,
                    'ReplyBody': result.ReplyBody,
                    'Filename[]': Filename,
                    'MIMEType[]': MIMEType,
                    'KeyPackets[]': KeyPackets,
                    'DataPacket[]': DataPacket
                };

                Eo.reply(decrypted_token, token_id, data)
                .then(
                    function(result) {
                        $log.debug('e');
                        $state.go('eo.message', {tag: $stateParams.tag});
                        notify($translate.instant('MESSAGE_SENT'));
                    },
                    function(error) {
                        $log.debug('f');
                        notify(error);
                    }
                );
            },
            function(err) {
                $log.debug('g');
            }
        );
    };

    $scope.cancel = function() {
        $state.go('eo.message', {tag: $stateParams.tag});
    };


    $scope.clean = function(body) {
        var content = angular.copy(body);

        content = tools.clearImageBody(content);
        $scope.imagesHidden = true;
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

    $scope.addAttachment = function(files) {
        var file = files[0];
        var totalSize = message.sizeAttachments();
        var sizeLimit = CONSTANTS.ATTACHMENT_SIZE_LIMIT;

        message.uploading = true;

        _.defaults(message, { Attachments: [] });

        if (angular.isDefined(message.Attachments) && message.Attachments.length === CONSTANTS.ATTACHMENT_NUMBER_LIMIT) {
            notify('Messages are limited to ' + CONSTANTS.ATTACHMENT_NUMBER_LIMIT + ' attachments');
            // TODO remove file in droparea
            return;
        }

        totalSize += file.size;

        var attachmentPromise;
        var element = $(file.previewElement);

        if (totalSize < (sizeLimit * 1024 * 1024)) {
            var publicKey = $scope.message.publicKey;
            attachments.load(file, publicKey).then(function(packets) {
                Filename.push(packets.Filename);
                MIMEType.push(packets.MIMEType);
                KeyPackets.push(new Blob([packets.keys]));
                DataPacket.push(new Blob([packets.data]));
                message.uploading = false;
                message.Attachments.push({
                    Name: file.name,
                    Size: file.size
                });
            });
        }
        else {
            // Attachment size error.
            notify('Attachments are limited to ' + sizeLimit + ' MB. Total attached would be: ' + totalSize + '.');
            // TODO remove file in droparea
            return;
        }
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
                        try {
                            var isFileSaverSupported = !!new Blob();

                            if(isFileSaverSupported) {
                                var blob = new Blob([attachment.data], {type: attachment.MIMEType});

                                saveAs(blob, attachment.Name);
                            }
                        } catch (error) {
                            console.log(error);
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

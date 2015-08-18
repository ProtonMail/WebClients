angular.module("proton.controllers.Outside", [
    "proton.routes",
    "proton.constants"
])

.controller("OutsideController", function(
    $filter,
    $interval,
    $log,
    $q,
    $scope,
    $state,
    $stateParams,
    $timeout,
    $translate,
    CONSTANTS,
    Eo,
    Message,
    attachments,
    authentication,
    message,
    notify,
    pmcw,
    tools
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
// http://localhost:8080/eo/fABD0Izp5boBsA3Q7BaP7F-nNeGvOPVLNIwW_oqUcHWqTlCojye_qm9-mHQLVjlbBCtw4W2vpyJBSdTccBxzGA==
    // start timer ago
    $scope.agoTimer = $interval(function() {
        var time = $filter('longReadableTime')($scope.message.Time);

        if($scope.isExpired()) {
            // Redirect to unlock view if the message is expire
            $state.go('eo.unlock', {tag: $stateParams.tag});
        }

        $scope.ago = time;
    }, 1000);

    $scope.$on('$destroy', function() {
        // cancel timer ago
        $interval.cancel($scope.agoTimer);
    });

    /**
     * Determine if the message is expire
     */
    $scope.isExpired = function() {
        var time = moment.unix($scope.message.Time);
        var current = moment.unix();

        return current.isAfter(time);
    };

    $scope.selectFile = function() {
        $('#inputFile').click();
    };

    $scope.send = function() {
        var deferred = $q.defer();
        var publicKey = $scope.message.publicKey;
        var bodyPromise = pmcw.encryptMessage($scope.message.Body, $scope.message.publicKey);
        var replyBodyPromise = pmcw.encryptMessage($scope.message.Body, [], password);

        $q.all({
            Body: bodyPromise,
            ReplyBody: replyBodyPromise
        })
        .then(
            function(result) {
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
                        $state.go('eo.message', {tag: $stateParams.tag});
                        notify($translate.instant('MESSAGE_SENT'));
                        deferred.resolve(result);
                    },
                    function(error) {
                        notify(error);
                        deferred.reject(error);
                    }
                );
            },
            function(err) {
                deferred.reject(err);
            }
        );

        return networkActivityTracker.track(deferred.promise);
    };

    $scope.cancel = function() {
        $state.go('eo.message', {tag: $stateParams.tag});
    };


    $scope.clean = function(body) {
        var content = angular.copy(body);

        content = tools.clearImageBody(content);
        $scope.imagesHidden = true;
        content = DOMPurify.sanitize(content, {
            ADD_ATTR: ['target'],
            FORBID_TAGS: ['style']
        });

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

    $scope.isFileSaverSupported = ('download' in document.createElement('a')) || navigator.msSaveOrOpenBlob;

    $scope.decryptAttachment = function(attachment, $event) {

        $event.preventDefault();

        var link = angular.element($event.target);
        var href = link.attr('href');

        if(href !== undefined && href.search(/^data.*/)!==-1) {
            alert("Your browser lacks features needed to download encrypted attachments directly. Please right-click on the attachment and select Save/Download As.");
            return false;
        }

        attachment.decrypting = true;

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
                            $scope.downloadAttachment({
                                data: decryptedAtt.data,
                                Name: decryptedAtt.filename,
                                MIMEType: attachment.MIMEType,
                                el: $event.target,
                            });
                            attachment.decrypting = false;
                            if(!$scope.isFileSaverSupported) {
                                $($event.currentTarget)
                                .prepend('<span class="fa fa-download"></span>');
                            }
                            $scope.$apply();
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

     $scope.downloadAttachment = function(attachment) {

        try {
            var blob = new Blob([attachment.data], {type: attachment.MIMEType});
            var link = $(attachment.el);
            if($scope.isFileSaverSupported) {
                saveAs(blob, attachment.Name);
            }
            else {
                // Bad blob support, make a data URI, don't click it
                var reader = new FileReader();

                reader.onloadend = function () {
                    link.attr('href',reader.result);
                };

                reader.readAsDataURL(blob);
            }
        } catch (error) {
            console.log(error);
        }
    };

});

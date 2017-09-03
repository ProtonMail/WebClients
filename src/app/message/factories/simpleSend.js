angular.module('proton.message')
    .factory('simpleSend', (messageApi, User, ComposerRequestStatus, pmcw, srp) => {
        const outsidersMap = {};

        function getDraftParameters(message) {
            const { Subject = '', From = {}, ToList = [], CCList = [], BCCList = [], AddressID } = message;

            return message.encryptBody(From.Keys[0].PublicKey)
                .then((Body) => ({
                    Message: {
                        Subject,
                        ToList,
                        CCList,
                        BCCList,
                        IsRead: 1,
                        AddressID,
                        Body
                    }
                }));
        }

        // Encrypt a message, given a list of emails and their public keys.
        // Returns an object containing a cleartext field set to true if the
        // message is sent unencrypted to some recipients, and an encrypt function
        // that encrypts the message and returns a list of package sets.
        function encryptFromPublicKeys(message, emails, publicKeys) {
            // First get the body's session key and data packet
            return message.cleartextBodyPackets()
                .then(({ sessionKey, dataPacket }) => {
                    // Encrypt the body's session key.
                    function encryptBodyKeyPacket(publicKeys = [], passwords = []) {
                        return pmcw.encryptSessionKey({
                            data: sessionKey.data,
                            algorithm: sessionKey.algorithm,
                            publicKeys: publicKeys.length > 0 ? pmcw.getKeys(publicKeys) : [],
                            passwords
                        }).then(({ message }) => {
                            return pmcw.encode_base64(pmcw.arrayToBinaryString(message.packets.write()));
                        });
                    }

                    // Return the cleartext body session key.
                    function cleartextBodyKeyPacket() {
                        return Promise.resolve(
                            pmcw.encode_base64(pmcw.arrayToBinaryString(sessionKey.data))
                        );
                    }

                    // Encrypt for a ProtonMail user.
                    function insideUser(publicKey) {
                        return Promise.all([
                            encryptBodyKeyPacket(publicKey),
                            message.encryptAttachmentKeyPackets(publicKey)
                        ])
                            .then(([BodyKeyPacket, AttachmentKeyPackets]) => {
                                return { Type: 1, BodyKeyPacket, AttachmentKeyPackets };
                            });
                    }

                    // Encrypt for outside (EO).
                    function encryptedOutsideUser(Token) {
                        // TODO: SRP support

                        // Encrypt the token, the body session key and each attachment's
                        // session key.
                        return Promise.all([
                            pmcw.encryptMessage({ data: Token, publicKeys: [], passwords: [message.Password] }),
                            encryptBodyKeyPacket([], [message.Password]),
                            message.encryptAttachmentKeyPackets([], [message.Password]),
                            srp.randomVerifier(message.Password)
                        ])
                            .then(([{ data }, BodyKeyPacket, AttachmentKeyPackets, verifier]) => {
                                return {
                                    Type: 2,
                                    PasswordHint: message.PasswordHint,
                                    Auth: verifier.Auth,
                                    Token,
                                    EncToken: data,
                                    BodyKeyPacket, AttachmentKeyPackets
                                };
                            })
                            .catch((err) => {
                                message.encrypting = false;
                                console.error(err);
                                throw err;
                            });
                    }

                    // Unencrypted for outside.
                    function cleartextUser() {
                        // TODO: Signature
                        return Promise.resolve({
                            Type: 4,
                            Signature: 0
                        });
                    }

                    // Build a package set for the message.
                    // TODO: PGP/MIME packages will need to be added to another package
                    // set, but is not yet implemented.
                    const packageSet = {
                        Type: 0,
                        Addresses: {},
                        MIMEType: 'text/html',
                        Body: pmcw.encode_base64(pmcw.arrayToBinaryString(dataPacket[0]))
                    };

                    let cleartext = false;

                    // Process each recipient
                    const promises = emails.map((email) => {
                        let promise;
                        if (publicKeys[email] && publicKeys[email].length > 0) {
                            // Inside user
                            promise = insideUser(publicKeys[email]);
                        } else if (message.IsEncrypted === 1) {
                            // Encrypted for outside (EO)
                            promise = encryptedOutsideUser(message.generateReplyToken());
                        } else {
                            // Cleartext for outside
                            cleartext = true;
                            promise = cleartextUser();
                        }

                        return promise.then((pkg) => {
                            packageSet.Addresses[email] = pkg;
                            packageSet.Type |= pkg.Type;
                        });
                    });

                    if (cleartext) {
                        // Add cleartext body & attachments keys only if necessary
                        promises.push(
                            Promise.all([
                                cleartextBodyKeyPacket(),
                                message.cleartextAttachmentKeyPackets()
                            ])
                                .then(([bodyKey, attachmentKeys]) => {
                                    packageSet.BodyKey = bodyKey;
                                    packageSet.AttachmentKeys = attachmentKeys;
                                })
                        );
                    }

                    // The message won't keep the ref
                    outsidersMap[message.ID] = cleartext;

                    return {
                        cleartext,
                        encrypt() {
                            return Promise.all(promises)
                                .then(() => [packageSet]);
                        }
                    };
                });
        }

        // Encrypt a message given a list of recipients. This function has the same
        // return value as encryptFromPublicKeys.
        function encryptFromEmails(message, emails) {
        // Remove duplicates
            const uniqueEmails = _.chain(emails).uniq().value();

            return message.getPublicKeys(uniqueEmails)
                .then(({ data = {} }) => {
                    if (data.Code !== ComposerRequestStatus.SUCCESS) {
                        throw new Error(data.Error || 'Cannot get public keys');
                    }

                    const publicKeys = data;

                    return encryptFromPublicKeys(message, uniqueEmails, publicKeys);
                })
                .catch((err) => {
                    console.log('Cannot encrypt message', err);
                    message.encrypting = false;
                    throw err;
                });
        }

        function getSendParameters(message) {
            const emails = message.emailsToString();
            const parameters = {
                id: message.ID,
                ExpirationTime: message.ExpirationTime
            };

            return encryptFromEmails(message, emails)
                .then(({ encrypt, cleartext }) => {
                    if (cleartext === true && message.Password.length === 0 && message.ExpirationTime) {
                        // Reject the error => to see the notification, and break the sending process
                        throw new Error('Expiring emails to non-ProtonMail recipients require a message password to be set. For more information, <a href="https://protonmail.com/support/knowledge-base/expiration/" target="_blank">click here</a>.');
                    }

                    return encrypt();
                })
                .then((packages) => {
                    parameters.Packages = packages;
                    return parameters;
                });
        }

        return (message) => {
            const promise = getDraftParameters(message)
                .then((draftParameters) => messageApi.createDraft(draftParameters))
                .then(({ data = {} }) => {
                    if (data.Code === 1000) {
                        return data.Message;
                    }
                    throw new Error(data.Error);
                })
                .then(({ ID }) => {
                    message.ID = ID;
                    return getSendParameters(message);
                })
                .then((sendParameters) => messageApi.send(sendParameters))
                .then(({ data = {} }) => {
                    if (data.Code === 1000) {
                        return data.Message;
                    }
                    throw new Error(data.Error);
                });

            return promise;
        };
    });

angular.module('proton.message')
    .factory('simpleSend', (messageApi, User, pmcw) => {
        function getDraftParameters(message) {
            const { Subject = '', From = {}, ToList = [], CCList = [], BCCList = [] } = message;

            return message.encryptBody(From.Keys[0].PublicKey)
                .then((Body) => ({
                    Message: {
                        Subject,
                        ToList,
                        CCList,
                        BCCList,
                        IsRead: 1,
                        AddressID: From.ID,
                        Body
                    }
                }));
        }

        function getPubKeys(emails) {
            const base64 = pmcw.encode_base64(emails.filter(Boolean).join(','));

            return User.pubkeys(base64)
                .then(({ data = {} } = {}) => {
                    if (data.Code === 1000) {
                        return data;
                    }
                    throw new Error(data.Error);
                });
        }

        function encryptUserBody(message, Packages) {
            const insideUser = (key, Address) => {
                return Promise.all([message.encryptBody(key), message.encryptPackets(key)])
                    .then(([Body, KeyPackets]) => (Packages.push({ Address, Type: 1, Body, KeyPackets }), Body));
            };

            const outsideUser = (Token, Address) => {

                return Promise.all([
                    pmcw.encryptMessage(Token, [], message.Password),
                    pmcw.encryptMessage(message.getDecryptedBody(), [], message.Password),
                    message.encryptPackets('', message.Password)
                ])
                .then(([EncToken, Body, KeyPackets]) => {
                    return Packages.push({
                        Type: 2,
                        PasswordHint: message.PasswordHint,
                        Address, Token, Body, KeyPackets, EncToken
                    });
                });
            };


            const getPromises = (emails, keys = {}) => {

                let outsiders = false;
                // We remove duplicatas
                const promises = _.chain(emails)
                    .uniq()
                    .reduce((acc, email) => {
                        // Inside user
                        if (keys[email] && keys[email].length > 0) {
                            // Encrypt content body in with the public key user
                            acc.push(insideUser(keys[email], email));
                            return acc;
                        }
                        // Outside user
                        outsiders = true;

                        if (message.IsEncrypted === 1) {
                            acc.push(outsideUser(message.generateReplyToken(), email));
                        }

                        return acc;
                    }, [])
                    .value();

                return { outsiders, promises };
            };

            return { getPromises, insideUser };
        }

        function getSendParameters(message) {
            const emails = message.emailsToString();
            const parameters = {
                id: message.ID,
                ExpirationTime: message.ExpirationTime
            };

            return getPubKeys(emails)
                .then((keys) => {
                    parameters.Packages = [];

                    const encryptingBody = encryptUserBody(message, parameters.Packages)
                        .getPromises(emails, keys);

                    const outsiders = encryptingBody.outsiders; // Initialize to false a Boolean variable to know if there are outsiders email in recipients list
                    const promises = encryptingBody.promises;


                    // If there are some outsiders
                    if (outsiders === true && message.Password.length === 0) {
                        parameters.AttachmentKeys = [];
                        parameters.ClearBody = message.getDecryptedBody(); // Add a clear body in parameter

                        if (message.Attachments.length > 0) {
                            // Add clear attachments packet in parameter
                            promises.push(
                                message.clearPackets()
                                    .then((packets) => parameters.AttachmentKeys = packets)
                            );
                        }
                    }

                    return Promise.all(promises)
                        .then(() => {
                            if (outsiders === true && message.Password.length === 0 && message.ExpirationTime) {
                                throw new Error('Expiring emails to non-ProtonMail recipients require a message password to be set. For more information, <a href="https://protonmail.com/support/knowledge-base/expiration/" target="_blank">click here</a>.');
                            }

                            return parameters;
                        });
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

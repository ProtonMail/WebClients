angular.module('proton.message')
    .factory('displayContent', ($rootScope, $q, prepareContent, tools) => {
        function detect(content) {
            // NOTE Plain text detection doesn't work. Check #1701
            return (tools.isHtml(content)) ? 'html' : 'plain';
        }

        function decrypt(message) {
            message.decrypting = true;
            return message
                .clearTextBody()
                .then((body) => (message.decrypting = false, body));
        }

        function parse(decrytedBody) {
            const deferred = $q.defer();
            const mailparser = new MailParser({ defaultCharset: 'UTF-8' });

            mailparser.on('end', (mail) => {
                let parsedContent;

                if (mail.html) {
                    parsedContent = mail.html;
                } else if (mail.text) {
                    parsedContent = mail.text;
                } else {
                    parsedContent = "Empty Message";
                }

                if (mail.attachments) {
                    parsedContent = "<div class='alert alert-danger'><span class='pull-left fa fa-exclamation-triangle'></span><strong>PGP/MIME Attachments Not Supported</strong><br>This message contains attachments which currently are not supported by ProtonMail.</div><br>"+parsedContent;
                }

                deferred.resolve(parsedContent);
            });

            mailparser.write(decrytedBody);
            mailparser.end();

            return deferred.promise;
        }

        function clean(content) {
            // Clear content with DOMPurify before anything happen!
            return DOMPurify.sanitize(content, {
                ADD_ATTR: ['target'],
                FORBID_TAGS: ['style', 'input', 'form']
            });
        }

        function show(content, message) {
            const type = detect(content);
            const body = prepareContent(content, message);

            return { type, body };
        }

        function read({ID}) {
            $rootScope.$emit('messageActions', {action: 'read', data: {ids: [ID]}});
        }

        return (message, body, index) => {

            return new Promise((resolve, reject) => {
                if (body) {
                    read(message);
                    return resolve({ body, type: detect(body) });
                }

                return decrypt(message)
                    .then((decrytedBody) => (message.IsEncrypted === 8) ? parse(decrytedBody) : decrytedBody)
                    .then((body) => clean(body))
                    .then((body) => show(body, message, false))
                    .then(({ type, body }) => {
                        read(message);
                        return { body, type };
                    })
                    .then(resolve)
                    .catch(reject);
            });
        };
    });

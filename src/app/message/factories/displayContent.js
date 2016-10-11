angular.module('proton.message')
    .factory('displayContent', ($rootScope, $q, $filter, prepareContent) => {
        function decrypt(message) {
            message.decrypting = true;
            return message
                .clearTextBody()
                .then((body) => (message.decrypting = false, body));
        }

        function withType(body, {MIMEType}) {
            const type = (MIMEType === 'text/plain') ? 'plain' : 'html';
            return { body, type };
        }

        function parse(decrytedBody) {
            const deferred = $q.defer();
            const mailparser = new MailParser({ defaultCharset: 'UTF-8' });

            mailparser.on('end', (mail) => {
                let type = 'html';
                let body = '';

                if (mail.html) {
                    body = mail.html;
                } else if (mail.text) {
                    type = 'plain';
                    body = mail.text;
                } else {
                    body = 'Empty Message';
                }

                if (mail.attachments) {
                    body = "<div class='alert alert-danger'><span class='pull-left fa fa-exclamation-triangle'></span><strong>PGP/MIME Attachments Not Supported</strong><br>This message contains attachments which currently are not supported by ProtonMail.</div><br>"+body;
                }

                deferred.resolve({ type, body });
            });

            mailparser.write(decrytedBody);
            mailparser.end();

            return deferred.promise;
        }

        function clean(content) {
            // Clear content with DOMPurify before anything happen!
            content.body = DOMPurify.sanitize(content.body, {
                ADD_ATTR: ['target'],
                FORBID_TAGS: ['style', 'input', 'form']
            });
            return content;
        }

        function prepare(content, message) {
            if (content.type === 'html') {
                content.body = prepareContent(content.body, message);
            } else {
                content.body = $filter('linky')(content.body, '_blank');
            }

            return content;
        }

        function read({ ID }) {
            $rootScope.$emit('messageActions', { action: 'read', data: { ids: [ID] } });
        }

        return (message, body) => {
            if (body) {
                read(message);
                return $q.when(withType(body, message));
            }

            return decrypt(message)
                .then((body) => (message.IsEncrypted === 8) ? parse(body) : withType(body, message))
                .then((content) => clean(content))
                .then((content) => prepare(content, message))
                .then((content) => {
                    read(message);
                    return content;
                });
        };
    });

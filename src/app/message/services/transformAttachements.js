angular.module('proton.message')
    .factory('transformAttachement', (embedded, $rootScope) => {
        return (body, message, action) => {

            /**
             * Usefull when we inject the content into the message (load:manual)
             */
            action && $rootScope.$emit('message.open', {
                type: 'embedded.injected',
                data: {
                    action: 'user.inject.load',
                    map: {},
                    message,
                    body: body.innerHTML
                }
            });

            embedded
                .parser(message, 'blob', body.innerHTML)
                .then(() => $rootScope.$emit('message.embedded', {
                    type: 'loaded',
                    data: { message, body, action }
                }));

            return body;
        };
    });

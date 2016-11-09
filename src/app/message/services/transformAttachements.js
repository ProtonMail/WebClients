angular.module('proton.message')
    .factory('transformAttachement', (embedded, $rootScope) => {
        return (body, message, action = 'proton.inject') => {
            embedded
                .parser(message, 'blob', body.innerHTML)
                .then(() => $rootScope.$emit('message.embedded', {
                    type: 'loaded',
                    data: { message, body, action }
                }));

            return body;
        };
    });

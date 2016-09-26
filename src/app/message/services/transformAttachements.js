angular.module('proton.message')
    .factory('transformAttachement', (embedded, $rootScope) => {
        return (body, message) => {
            embedded
                .parser(message, 'blob', body.innerHTML)
                .then(() => $rootScope.$emit('message.embedded.loaded', message, body));

            return body;
        };
    });

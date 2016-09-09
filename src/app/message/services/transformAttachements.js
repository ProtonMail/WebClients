angular.module('proton.message')
    .factory('transformAttachement', (embedded, $rootScope) => {
        return (html, message) => {
            embedded
                .parser(message, 'blob', html.innerHTML)
                .then(() => $rootScope.$emit('embedded.loaded'));
            return html;
        };
    });

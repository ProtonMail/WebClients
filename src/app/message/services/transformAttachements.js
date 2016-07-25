angular.module('proton.message')
    .factory('transformAttachement', (embedded, $rootScope) => {
        return (html, message) => {
            embedded
                .parser(message)
                .then(() => {
                    _rAF(() => $rootScope.$emit('embedded.loaded'));
                });

            return html;
        };
    });

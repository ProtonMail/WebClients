angular.module('proton.message')
    .factory('displayEmbedded', (prepareContent) => {
        return (message = {}, decryptedBody = '') => {
            message.showEmbedded = true;

            return prepareContent(decryptedBody, message, ['transformLinks', 'transformRemote', 'transformWelcome', 'transformBlockquotes']);
        };
    });

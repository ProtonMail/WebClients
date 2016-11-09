angular.module('proton.message')
    .factory('displayEmbedded', (prepareContent) => {
        return (message = {}, decryptedBody = '', action) => {
            message.showEmbedded = true;

            return prepareContent(decryptedBody, message, {
                blacklist: ['transformLinks', 'transformRemote', 'transformWelcome', 'transformBlockquotes'],
                action
            });
        };
    });

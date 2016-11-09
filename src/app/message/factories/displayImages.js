angular.module('proton.message')
    .factory('displayImages', (prepareContent) => {
        return (message = {}, decryptedBody = '') => {
            message.showImages = true;

            return prepareContent(decryptedBody, message, {
                blacklist: ['transformLinks', 'transformEmbedded', 'transformWelcome', 'transformBlockquotes']
            });
        };
    });

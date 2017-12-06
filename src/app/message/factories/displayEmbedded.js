/* @ngInject */
function displayEmbedded(prepareContent) {
    return (message = {}, decryptedBody = '', action) => {
        message.showEmbedded = true;

        return prepareContent(decryptedBody, message, {
            blacklist: ['transformLinks', 'transformRemote', 'transformWelcome', 'transformBlockquotes'],
            action
        });
    };
}
export default displayEmbedded;

/* @ngInject */
function attachPublicKey($rootScope, authentication, attachmentModel, pmcw) {
    const fileFromKeyInfo = (message, { publicKeyArmored, fingerprint }) => {
        const file = new Blob([publicKeyArmored], { type: 'application/pgp-keys' });
        file.name = `publickey - ${message.From.Email} - 0x${fingerprint.slice(0, 8).toUpperCase()}.asc`;
        file.inline = 0;
        return file;
    };

    const attachPublicKey = (message) => {
        if (!message.primaryKeyAttached) {
            return Promise.resolve();
        }

        const privateKeys = authentication.getPrivateKeys(message.From.ID)[0];
        return pmcw
            .keyInfo(privateKeys.armor())
            .then((info) => fileFromKeyInfo(message, info))
            .then((file) => attachmentModel.create(file, message, false))
            .then(({ attachment }) => (attachment.isPublicKey = true));
    };

    const removePublicKey = async (message) => {
        const list = message.Attachments.filter(({ isPublicKey = false }) => isPublicKey);
        $rootScope.$emit('attachment.upload', { type: 'remove.all', data: { message, list } });
    };

    return { attach: attachPublicKey, remove: removePublicKey };
}
export default attachPublicKey;

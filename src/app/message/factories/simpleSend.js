/* @ngInject */
function simpleSend(messageApi, User, ComposerRequestStatus, pmcw, srp, encryptMessage) {
    const getDraftParameters = async (message) => {
        const { Subject = '', ToList = [], CCList = [], BCCList = [], AddressID, From = {} } = message;
        const { DisplayName, Email, Keys } = From;
        const [{ PublicKey } = {}] = Keys || {};

        const Body = await message.encryptBody(PublicKey);
        return {
            Message: {
                AddressID,
                Body,
                Subject,
                ToList,
                CCList,
                BCCList,
                IsRead: 1,
                Sender: { Name: DisplayName || '', Address: Email } // Default empty display name is null
            }
        };
    };

    async function getSendParameters(message) {
        const { AutoSaveContacts } = message;
        const { encrypt, cleartext } = await encryptMessage(message, message.emailsToString());
        if (cleartext === true && message.Password.length === 0 && message.ExpirationTime) {
            // Reject the error => to see the notification, and break the sending process
            throw new Error(
                'Expiring emails to non-ProtonMail recipients require a message password to be set. For more information, <a href="https://protonmail.com/support/knowledge-base/expiration/" target="_blank">click here</a>.'
            );
        }

        const Packages = await encrypt();
        return {
            id: message.ID,
            AutoSaveContacts,
            ExpirationTime: message.ExpirationTime,
            Packages
        };
    }

    const createDraft = async (message) => {
        try {
            const config = await getDraftParameters(message);
            const { data = {} } = await messageApi.createDraft(config);

            return data.Message;
        } catch (err) {
            const { data = {} } = err || {};
            throw new Error(data.Error);
        }
    };

    const send = async (message) => {
        try {
            const config = await getSendParameters(message);
            const { data = {} } = await messageApi.send(config);

            return data.Message;
        } catch (err) {
            const { data = {} } = err || {};
            throw new Error(data.Error);
        }
    };

    return async (message) => {
        const { ID } = await createDraft(message);
        message.ID = ID;
        return send(message);
    };
}
export default simpleSend;

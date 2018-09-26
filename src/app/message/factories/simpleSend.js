/* @ngInject */
function simpleSend(messageApi, User, pmcw, srp, encryptMessage) {
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
                Unread: 0,
                Sender: { Name: DisplayName || '', Address: Email } // Default empty display name is null
            }
        };
    };

    async function getSendParameters(message) {
        const { AutoSaveContacts } = message;
        const Packages = await encryptMessage(message, message.emailsToString());
        return {
            id: message.ID,
            AutoSaveContacts,
            ExpirationTime: message.ExpirationTime,
            Packages
        };
    }

    const createDraft = async (message) => {
        const config = await getDraftParameters(message);
        const { data = {} } = await messageApi.createDraft(config);

        return data.Message;
    };

    const send = async (message) => {
        const config = await getSendParameters(message);
        const { data = {} } = await messageApi.send(config);

        return data.Message;
    };

    return async (message) => {
        const { ID, MIMEType } = await createDraft(message);
        message.ID = ID;
        message.MIMEType = MIMEType;
        return send(message);
    };
}
export default simpleSend;

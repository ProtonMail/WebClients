import _ from 'lodash';

/* @ngInject */
function encryptMessage(
    dispatchers,
    postMessage,
    sendPreferences,
    encryptPackages,
    attachSubPackages,
    generateTopPackages
) {
    const { dispatcher } = dispatchers(['actionMessage']);
    const dispatchMessageAction = (message) => dispatcher.actionMessage('update', message);

    const generatePackages = (message, emails, sendPref) => {
        return generateTopPackages(message, sendPref)
            .then((packages) => attachSubPackages(packages, message, emails, sendPref))
            .then((packages) => encryptPackages(message, packages));
    };

    /**
     * Encrypt a message given a list of recipients.
     * @param message
     * @param emails
     * @returns {Promise.<void>}
     */
    const encryptMessage = async (message, emails) => {
        try {
            const uniqueEmails = _.uniq(emails);
            const sendPrefs = await sendPreferences.get(uniqueEmails, message);
            // todo regression testing: https://github.com/ProtonMail/Angular/issues/5088

            const packages = await generatePackages(message, emails, sendPrefs);

            /*
             * we do not re-encrypt the draft body if the packages contain the draft body: the generatePackages call will have
             * generated the body correctly (otherwise it breaks deduplication)
             */
            const encrypt = !packages.map(({ MIMEType }) => MIMEType).includes(message.MIMEType);
            // save the draft with the re-encrypted body
            await postMessage(message, { loader: false, encrypt });

            return packages;
        } catch (err) {
            console.error('Cannot encrypt message', err);
            message.encrypting = false;
            dispatchMessageAction(message);
            throw err;
        }
    };
    return encryptMessage;
}
export default encryptMessage;

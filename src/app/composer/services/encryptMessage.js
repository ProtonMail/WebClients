import _ from 'lodash';

/* @ngInject */
function encryptMessage(
    CONSTANTS,
    $rootScope,
    gettextCatalog,
    sendPreferences,
    encryptPackages,
    attachSubPackages,
    generateTopPackages
) {
    const dispatchMessageAction = (message) => $rootScope.$emit('actionMessage', { data: message });

    const { SEND_TYPES } = CONSTANTS;

    const EXPIRE_ERROR =
        gettextCatalog.getString(
            'Expiring emails to non-ProtonMail recipients require a message password to be set. For more information, {{link}}click here',
            {
                link: '<a href="https://protonmail.com/support/knowledge-base/expiration/" target="_blank">'
            },
            'Send message'
        ) + '</a>';

    const checkPreconditions = (message, sendPref) => {
        const supportsExpiration = _.every(sendPref, (info) => {
            const isPMRecipient = info.scheme === SEND_TYPES.SEND_PM;
            const hasPasswordSet = message.Password.length > 0 && message.IsEncrypted === 1;
            return isPMRecipient || hasPasswordSet;
        });

        if (message.ExpirationTime && !supportsExpiration) {
            const error = new Error(EXPIRE_ERROR);
            error.raw = true;
            throw error;
        }
    };

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
            checkPreconditions(message, emails, sendPrefs);
            // todo regression testing: https://github.com/ProtonMail/Angular/issues/5088

            return generatePackages(message, emails, sendPrefs);
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

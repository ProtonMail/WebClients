import { MAX_TITLE_LENGTH, UNPAID_STATE, REGEX_EMAIL, MIME_TYPES } from '../../constants';

const { PLAINTEXT } = MIME_TYPES;

/* @ngInject */
function validateMessage(gettextCatalog, tools, confirmModal, authentication, notification, addressWithoutKeys) {

    const I18N = {
        STILL_UPLOADING: gettextCatalog.getString('Wait for attachment to finish uploading or cancel upload.', null, 'Error'),
        invalidEmails(total) {
            return gettextCatalog.getString('Invalid email(s): {{total}}', { total }, 'Error');
        },
        MAX_BODY_LENGTH: gettextCatalog.getString('The maximum length of the message body is 16,000,000 characters.', null, 'Error'),
        NO_RECIPIENT: gettextCatalog.getString('Please enter at least one recipient.', null, 'Error'),
        MAX_SUBJECT_LENGTH: gettextCatalog.getString('The maximum length of the subject is {{size}}.', { size: MAX_TITLE_LENGTH }, 'Error'),
        maxRecipients(total) {
            return gettextCatalog.getString('You have {{total}} recipients. The maximum number is 25.', { total }, 'Error');
        },
        NO_SUBJECT_TITLE: gettextCatalog.getString('No subject', null, 'Title'),
        NO_SUBJECT_MESSAGE: gettextCatalog.getString('No subject, send anyway?', null, 'Info'),
        ERROR_ADDRESSES_INFO_PRIVATE: gettextCatalog.getString('You can generate your keys here', null, 'Error'),
        ERROR_ADDRESSES: gettextCatalog.getString('No address with keys available to compose a message.', null, 'Error'),
        MEMBER: gettextCatalog.getString('Addresses / Users', null, 'Title'),
        ERROR_ADDRESSES_INFO: gettextCatalog.getString('Contact your organization’s administrator to resolve this.', null, 'Error'),
        ERROR_DELINQUENT: gettextCatalog.getString('Your account currently has an overdue invoice. Please pay all unpaid invoices.', null, 'Info')
    };

    const cleanEmails = (message) => {
        message.ToList.concat(message.CCList, message.BCCList).forEach((item) => {
            item.Address = item.Address.trim();
        });
    };

    async function validate(message) {
        if (message.MIMEType !== PLAINTEXT) {
            message.setDecryptedBody(tools.fixImages(message.getDecryptedBody()));
        }

        // We delay the validation to let the time for the autocomplete
        // Check if there is an attachment uploading
        if (message.uploading > 0) {
            throw new Error(I18N.STILL_UPLOADING);
        }
        cleanEmails(message);
        const emailStats = message.ToList.concat(message.CCList, message.BCCList).reduce(
            (acc, { Address = '' }) => {
                acc.all.push(Address);
                !REGEX_EMAIL.test(Address) && acc.invalid.push(Address);
                acc.total++;
                return acc;
            },
            { all: [], invalid: [], total: 0 }
        );

        if (emailStats.invalid.length) {
            throw new Error(I18N.invalidEmails(emailStats.invalid.join(',')));
        }

        // MAX 25 to, cc, bcc
        if (emailStats.total > 25) {
            throw new Error(I18N.maxRecipients(emailStats.total));
        }

        if (!emailStats.total) {
            throw new Error(I18N.NO_RECIPIENT);
        }

        // Check title length
        if (message.Subject && message.Subject.length > MAX_TITLE_LENGTH) {
            throw new Error(I18N.MAX_SUBJECT_LENGTH);
        }

        // Check body length
        if (message.getDecryptedBody().length > 16000000) {
            throw new Error(I18N.MAX_BODY_LENGTH);
        }
    }

    /**
     * Check if the subject of this message is empty
     * And ask the user to send anyway
     * @param {Object} message
     */
    async function checkSubject({ Subject }) {
        if (Subject) {
            return;
        }

        return new Promise((resolve, reject) => {
            confirmModal.activate({
                params: {
                    title: I18N.NO_SUBJECT_TITLE,
                    message: I18N.NO_SUBJECT_MESSAGE,
                    confirm() {
                        confirmModal.deactivate();
                        resolve();
                    },
                    cancel() {
                        confirmModal.deactivate();
                        reject();
                    }
                }
            });
        });
    }

    /**
     * Private user can generate keys, invite him to generate them
     */
    const getErrorInfo = () => {
        if (authentication.user.Private) {
            return `${I18N.ERROR_ADDRESSES_INFO_PRIVATE} <a href="/members">${I18N.MEMBER}</a>`;
        }
        return I18N.ERROR_ADDRESSES_INFO;
    };

    function canWrite() {
        // In delinquent state
        if (authentication.user.Delinquent >= UNPAID_STATE.DELINQUENT) {
            return notification.error(I18N.ERROR_DELINQUENT);
        }

        // You cannot compose messages without a valid address
        if (addressWithoutKeys.allDirty()) {
            return notification.error(`${I18N.ERROR_ADDRESSES}<br>${getErrorInfo()}`);
        }

        return true;
    }

    return { checkSubject, validate, canWrite };
}
export default validateMessage;

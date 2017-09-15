angular.module('proton.composer')
    .factory('validateMessage', (gettextCatalog, tools, regexEmail, CONSTANTS, confirmModal) => {

        const I18N = {
            STILL_UPLOADING: gettextCatalog.getString('Wait for attachment to finish uploading or cancel upload.', null, 'Error'),
            invalidEmails(total) {
                return gettextCatalog.getString(`Invalid email(s): ${total}.`, null, 'Error');
            },
            MAX_BODY_LENGTH: gettextCatalog.getString('The maximum length of the message body is 16,000,000 characters.', null, 'Error'),
            NO_RECIPIENT: gettextCatalog.getString('Please enter at least one recipient.', null, 'Error'),
            MAX_SUBJECT_LENGTH: gettextCatalog.getString(`The maximum length of the subject is ${CONSTANTS.MAX_TITLE_LENGTH}.`, null, 'Error'),
            maxRecipients(total) {
                return gettextCatalog.getString(`The maximum number (${total}) of Recipients is 25.`, null, 'Error');
            },
            NO_SUBJECT_TITLE: gettextCatalog.getString('No subject', null, 'Title'),
            NO_SUBJECT_MESSAGE: gettextCatalog.getString('No subject, send anyway?', null, 'Info')
        };

        async function validate(message) {

            message.setDecryptedBody(tools.fixImages(message.getDecryptedBody()));

            // We delay the validation to let the time for the autocomplete
            // Check if there is an attachment uploading
            if (message.uploading > 0) {
                throw new Error(I18N.STILL_UPLOADING);
            }

            const emailStats = message.ToList.concat(message.CCList, message.BCCList)
                .reduce((acc, { Address = '' }) => {
                    const email = Address.trim();
                    acc.all.push(email);
                    !regexEmail.test(email) && acc.invalid.push(email);
                    acc.total++;
                    return acc;
                }, { all: [], invalid: [], total: 0 });

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
            if (message.Subject && message.Subject.length > CONSTANTS.MAX_TITLE_LENGTH) {
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

        return { checkSubject, validate };
    });

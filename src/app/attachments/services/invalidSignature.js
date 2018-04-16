import { KNOWLEDGE_BASE } from '../../constants';

/* @ngInject */
function invalidSignature(gettextCatalog, confirmModal) {
    const CACHE = {};
    const ICON = 'fa fa-warning confirm-warning-icon';

    const askAgain = ({ ID: messageID }, { ID: attachmentID }, value) => (CACHE[messageID + attachmentID] = !value);

    const confirm = (message, attachment) => {
        return new Promise((resolve, reject) => {
            if (CACHE[message.ID + attachment.ID]) {
                resolve();
                return;
            }
            confirmModal.activate({
                params: {
                    icon: ICON,
                    learnMore: KNOWLEDGE_BASE.DIGITAL_SIGNATURE,
                    title: gettextCatalog.getString('Invalid attachment signature', null, 'Title'),
                    message: gettextCatalog.getString('Do you still want to download <strong>{{name}}</strong>?', { name: attachment.Name }, 'Info'),
                    confirm() {
                        confirmModal.deactivate();
                        askAgain(message, attachment, false);
                        resolve();
                    },
                    cancel() {
                        confirmModal.deactivate();
                        askAgain(message, attachment, true);
                        reject();
                    }
                }
            });
        });
    };

    return { confirm, askAgain };
}
export default invalidSignature;

import { isReceived } from '../../../helpers/message';

/* @ngInject */
function printMessageModel($filter, gettextCatalog) {
    const mapIcons = {
        isReplied: 'fa-reply',
        isRepliedAll: 'fa-reply-all',
        isForwarded: 'fa-mail-forward'
    };

    const I18N = {
        received: gettextCatalog.getString('Received:', null, 'printed message info'),
        sent: gettextCatalog.getString('Sent:', null, 'printed message info')
    };

    /**
     * Helper to create a list from Array of email Object
     * @param {Array} list
     * @return {String}
     */
    const getList = (list = []) => list.map(({ Name = '', Address = '' }) => `${Name} ${Address}`.trim()).join(', ');

    /**
     * Returns a list of icons
     * @param {Object} message
     * @return {Array} icons
     */
    const getIcons = (message = {}) => {
        return ['isReplied', 'isRepliedAll', 'isForwarded'].reduce((acc, key) => {
            if (message[key]()) {
                acc.push(mapIcons[key]);
            }
            return acc;
        }, []);
    };

    /**
     * Title to display in the print message view
     * @param {Object} message
     * @return {String}
     */
    const getTitle = (message) => {
        if (isReceived(message)) {
            return I18N.received;
        }

        return I18N.sent;
    };

    /**
     * Prepare message model to print
     * @param {Object} config.message
     * @return {Object} model
     */
    return ({ message }) => {
        const {
            MIMEType,
            Subject: subject,
            ToList = [],
            CCList = [],
            BCCList = [],
            Time,
            Sender,
            Attachments = []
        } = message;

        return {
            MIMEType,
            subject,
            title: getTitle(message),
            icons: getIcons(message),
            sender: getList([Sender]),
            to: getList(ToList),
            cc: getList(CCList),
            bcc: getList(BCCList),
            time: $filter('localReadableTime')(Time),
            Attachments // Keep it capitalize for listAttachments directive
        };
    };
}
export default printMessageModel;

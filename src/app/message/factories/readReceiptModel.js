import { MESSAGE_FLAGS } from '../../constants';
import { extractChevrons } from '../../../helpers/string';

const { FLAG_RECEIPT_SENT, FLAG_SENT } = MESSAGE_FLAGS;

/* @ngInject */
function readReceiptModel(addressesModel, eventManager, messageApi) {
    /**
     * Send read receipt confirmation
     * @param {String} message.ID
     * @return {Promise}
     */
    const sendConfirmation = async ({ ID }) => {
        await messageApi.receipt(ID);
        await eventManager.call(); // To get an update on the messageModel (Flags)
    };

    /**
     * Detect if message requires read receipt confirmation
     * @param {Integer} message.Flags
     * @param {Object} message.ParsedHeaders
     * @return {Boolean} address model
     */
    const requireConfirmation = ({ Flags, ParsedHeaders = {} }) => {
        const dispositionNotificationTo = ParsedHeaders['Disposition-Notification-To']; // ex: Andy <andy@pm.me>

        if (!dispositionNotificationTo) {
            return false;
        }

        if (Flags & (FLAG_RECEIPT_SENT | FLAG_SENT)) {
            // Read receipt already sent to this message
            // or message sent
            return false;
        }

        const email = extractChevrons(dispositionNotificationTo); // ex: andy@pm.me

        return addressesModel.getByEmail(email);
    };

    return { sendConfirmation, requireConfirmation };
}
export default readReceiptModel;

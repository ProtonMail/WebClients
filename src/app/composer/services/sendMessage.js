import _ from 'lodash';

import { STATUS, MAILBOX_IDENTIFIERS } from '../../constants';
import { API_CUSTOM_ERROR_CODES } from '../../errors';
import { getConversationLabels } from '../../conversation/helpers/conversationHelpers';

/* @ngInject */
function sendMessage(
    sendPreferences,
    keyCache,
    composerRequestModel,
    dispatchers,
    messageModel,
    gettextCatalog,
    embedded,
    outsidersMap,
    encryptMessage,
    messageRequest,
    notification,
    cache,
    attachmentApi,
    SignatureVerifier,
    recipientsFormator
) {
    const I18N = {
        SEND_SUCCESS: gettextCatalog.getString('Message sent', null, 'Send message'),
        EXPIRE_ERROR: gettextCatalog.getString(
            'Expiring emails to non-ProtonMail recipients require a message password to be set. For more information, {{link}}click here',
            {
                link: '<a href="https://protonmail.com/support/knowledge-base/expiration/" target="_blank">'
            },
            'Send message'
        )
    };
    const { dispatcher } = dispatchers(['actionMessage', 'composer.update', 'message.open']);
    const dispatchMessageAction = (message) => dispatcher.actionMessage('update', message);

    const prepare = async (message, parameters) => {
        message.encrypting = true;
        dispatchMessageAction(message);
        parameters.id = message.ID;
        parameters.ExpirationTime = message.ExpirationTime;

        // remove all the data sources
        if (!message.isPlainText()) {
            const body = await embedded.parser(message, {
                direction: 'cid',
                isOutside: outsidersMap.get(message.ID)
            });
            message.setDecryptedBody(body);
        }
        return message.emailsToString();
    };

    /**
     * Ensures that either all attachments have signatures or all have no signatures. The BE can only accept both,
     * and we can leave them on a draft, but then the signatures that are send do not match the signatures that are
     * received.
     * @param {Message} message
     * @returns {Promise.<boolean>}
     */
    const handleAttachmentSigs = async (message) => {
        if (message.Attachments.every(({ Signature }) => Signature)) {
            return false;
        }
        /*
         Not all attachments have signatures: remove the signature from the attachments, so they don't show up
         in the send message.
         */
        const signedAttachments = _.filter(message.Attachments, ({ Signature }) => Signature);
        const promises = _.map(signedAttachments, async (attachment) => {
            attachment.Signature = null;
            await attachmentApi.updateSignature(attachment);
            // save the signature as unverified. the attachment data is always ignored in this case.
            return SignatureVerifier.verify(attachment, null, message);
        });
        return Promise.all(promises).then(() => true);
    };

    const send = async (message, parameters, retry = true) => {
        const emails = await prepare(message, parameters);
        // we await later for parallel performance.
        const attachmentUpdates = handleAttachmentSigs(message);

        const packages = await encryptMessage(message, emails);
        parameters.Packages = packages;
        // wait on the signature promise after the encrypt, so it can be done in parallel with the encryption
        // which is better for performance.
        await attachmentUpdates;
        message.encrypting = false;
        dispatchMessageAction(message);
        // Avoid to have SAVE and SEND request in the same time
        // Make sure to keep that just before the send message API request
        await composerRequestModel.chain(message);
        const suppress = retry ? [API_CUSTOM_ERROR_CODES.MESSAGE_VALIDATE_KEY_ID_NOT_ASSOCIATED] : [];
        try {
            return await messageRequest.send(parameters, suppress);
        } catch (e) {
            if (retry && e.data.Code === API_CUSTOM_ERROR_CODES.MESSAGE_VALIDATE_KEY_ID_NOT_ASSOCIATED) {
                sendPreferences.clearCache();
                keyCache.clearCache();
                // retry if we used the wrong keys
                return send(message, parameters, false);
            }
            throw e;
        }
    };

    const pipe = async (message, parameters = {}) => {
        const { Parent, Sent = {} } = await send(message, parameters);

        dispatcher['composer.update']('send.success', {
            message, // Because we need the ref to close the compose... today
            discard: false,
            save: false
        });

        const { NumMessages = 1, ContextNumUnread = 0, Labels = [] } =
            cache.getConversationCached(Sent.ConversationID) || {};

        // The back-end doesn't return Senders nor Recipients
        Sent.Senders = [Sent.Sender];
        Sent.Recipients = recipientsFormator.toList(message);

        // Generate event for this message
        const events = [{ Action: STATUS.UPDATE_FLAGS, ID: Sent.ID, Message: Sent }];

        if (Parent) {
            events.push({ Action: STATUS.UPDATE_FLAGS, ID: Parent.ID, Message: Parent });
        }

        events.push({
            Action: STATUS.UPDATE_FLAGS,
            ID: Sent.ConversationID,
            Conversation: {
                NumMessages,
                ContextNumUnread,
                Recipients: Sent.Recipients,
                Senders: Sent.Senders,
                Subject: Sent.Subject,
                ID: Sent.ConversationID,
                Labels: getConversationLabels(
                    { ContextNumUnread, Labels },
                    {
                        toAdd: [MAILBOX_IDENTIFIERS.allSent, MAILBOX_IDENTIFIERS.sent],
                        toRemove: [MAILBOX_IDENTIFIERS.allDrafts, MAILBOX_IDENTIFIERS.drafts]
                    }
                )
            }
        });

        notification.success(I18N.SEND_SUCCESS);
        cache.events(events, false, true);

        _.delay(() => {
            dispatcher['message.open']('save.success', {
                message: messageModel(Sent)
            });
        }, 500);
    };

    return pipe;
}
export default sendMessage;

import _ from 'lodash';

/* @ngInject */
function sendMessage(
    CONSTANTS,
    messageModel,
    gettextCatalog,
    encryptMessage,
    messageRequest,
    notification,
    cache,
    $rootScope,
    attachmentApi,
    SignatureVerifier
) {
    const { STATUS } = CONSTANTS;
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

    const dispatchMessageAction = (message) => $rootScope.$emit('actionMessage', { data: message });

    const prepare = (message, parameters) => {
        message.encrypting = true;
        dispatchMessageAction(message);
        parameters.id = message.ID;
        parameters.ExpirationTime = message.ExpirationTime;
        return message.emailsToString();
    };

    /**
     * Ensures that either all attachments have signatures or all have no signatures. The BE can only accept both,
     * and we can leave them on a draft, but then the signatures that are send do not match the signatures that are
     * received.
     * @param {Message} message
     * @returns {Promise.<boolean>}
     */
    const handleAttachmentSigs = (message) => {
        if (message.Attachments.every(({ Signature }) => Signature)) {
            return Promise.resolve(false);
        }
        /*
             Not all attachments have signatures: remove the signature from the attachments, so they don't show up
             in the send message.
             */
        const signedAttachments = _.filter(message.Attachments, ({ Signature }) => Signature);
        const promises = _.map(signedAttachments, (attachment) => {
            attachment.Signature = null;
            return (
                attachmentApi
                    .updateSignature(attachment)
                    // save the signature as unverified. the attachment data is always ignored in this case.
                    .then(() => SignatureVerifier.verify(attachment, null, message))
            );
        });
        return Promise.all(promises).then(() => true);
    };

    const send = async (message, parameters) => {
        const emails = prepare(message, parameters);
        // we await later for parallel performance.
        const attachmentUpdates = handleAttachmentSigs(message);

        const packages = await encryptMessage(message, emails);
        parameters.Packages = packages;
        // wait on the signature promise after the encrypt, so it can be done in parallel with the encryption
        // which is better for performance.
        await attachmentUpdates;
        message.encrypting = false;
        dispatchMessageAction(message);
        return messageRequest.send(parameters);
    };

    const pipe = async (message, parameters = {}) => {
        const { Parent, Sent = {} } = await send(message, parameters);

        $rootScope.$emit('composer.update', {
            type: 'send.success',
            data: {
                message, // Because we need the ref to close the compose... today
                discard: false,
                save: false
            }
        });

        const conversation = cache.getConversationCached(Sent.ConversationID);
        const NumMessages = angular.isDefined(conversation) ? conversation.NumMessages : 1;
        const ContextNumUnread = angular.isDefined(conversation) ? conversation.ContextNumUnread : 0;

        // The back-end doesn't return Senders nor Recipients
        Sent.Senders = [Sent.Sender];
        Sent.Recipients = _.uniq(message.ToList.concat(message.CCList, message.BCCList));

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
                LabelIDsAdded: [CONSTANTS.MAILBOX_IDENTIFIERS.allSent, CONSTANTS.MAILBOX_IDENTIFIERS.sent],
                LabelIDsRemoved: [CONSTANTS.MAILBOX_IDENTIFIERS.allDrafts, CONSTANTS.MAILBOX_IDENTIFIERS.drafts]
            }
        });

        notification.success(I18N.SEND_SUCCESS);
        cache.events(events, false, true);

        _.delay(() => {
            $rootScope.$emit('message.open', {
                type: 'save.success',
                data: {
                    message: messageModel(Sent)
                }
            });
        }, 500);
    };

    return pipe;
}
export default sendMessage;

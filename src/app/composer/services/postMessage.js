import _ from 'lodash';

import { STATUS, ENCRYPTED_STATUS, MAILBOX_IDENTIFIERS } from '../../constants';

/* @ngInject */
function postMessage(
    $rootScope,
    messageRequest,
    ComposerRequestStatus,
    cache,
    notify,
    gettextCatalog,
    messageApi,
    composerRequestModel,
    embedded,
    outsidersMap,
    networkActivityTracker,
    $filter,
    AttachmentLoader,
    attachmentModel,
    embeddedUtils
) {
    const I18N = {
        SAVE_MESSAGE_SUCCESS: gettextCatalog.getString('Message saved', null, 'Record message')
    };
    const unicodeTagView = $filter('unicodeTagView');
    const dispatchMessageAction = (message) => $rootScope.$emit('actionMessage', { data: message });

    const isPGPAttachment = ({ Encrypted }) => Encrypted === ENCRYPTED_STATUS.PGP_MIME;

    /**
     * Uploads the list of pgp attachments as normal protonmail attachments which are stored as attachment object in the backend
     * This must be done because pgp/MIME attachments are actually stored in the body, and are thus unaccessable
     * For protonmail. But we need to upload them again to be able to send them using the protonmail api. They are
     * of course still encrypted, but now separately.
     * @param {Object} message
     * @param {Object} pgpAttachments A set of pgp attachments (which are not actually stored on the BE, but in the body)
     */
    const makeNative = (message, pgpAttachments) => {
        const promises = _.map(pgpAttachments, async (attachment) => {
            // message parameter doesn't really matter in this case as the attachment should be in the cache
            const data = await AttachmentLoader.get(attachment);
            const file = new Blob([data]);
            const cid = embeddedUtils.readCID(attachment.Headers);
            file.name = attachment.Name;
            if (cid) {
                file.inline = Number(embeddedUtils.isEmbedded(attachment));
            }
            const { attachment: nativeAttachment } = await attachmentModel.create(
                file,
                message,
                file.inline === 1,
                cid
            );

            return { [attachment.ID]: nativeAttachment };
        });
        return Promise.all(promises);
    };

    const uploadPGPMimeAttachments = async (message) => {
        // @pre: all attachments are inline. so we are not copying 'real' attachments here.
        const mimeAttachments = _.filter(message.Attachments, isPGPAttachment);
        const nativeAttachments = await makeNative(message, mimeAttachments);
        return _.extend({}, ...nativeAttachments);
    };

    const signAttachments = (message) => {
        const unsigned = _.filter(message.Attachments, ({ Signature }) => !Signature);
        const signable = _.filter(unsigned, AttachmentLoader.has);
        const promises = _.map(signable, (attachment) => attachmentModel.sign(attachment, message));
        return Promise.all(promises);
    };

    /**
     * Extend local attachements for a message with remote's
     * @param  {Array} collection Attachements from the message
     * @param  {Array} list       Attachements from the remote
     * @return {Array}            Merge
     */
    function syncAttachmentsRemote(localMessage, remoteMessage) {
        const map = localMessage.Attachments.reduce((acc, att) => {
            acc[att.ID] = att;
            att.AttachmentID && (acc[att.AttachmentID] = att);
            return acc;
        }, {});
        return remoteMessage.Attachments.reduce((acc, att = {}) => {
            // Find if attachement already exists
            acc.push(_.extend({}, map[att.ID], att));
            return acc;
        }, []);
    }

    const makeParams = async (message, autosaving) => {
        const parameters = {
            Message: _.pick(message, 'ToList', 'CCList', 'BCCList', 'Subject', 'IsRead', 'MIMEType')
        };
        parameters.Message.Subject = parameters.Message.Subject || '';

        message.saving = true;
        message.autosaving = autosaving;
        dispatchMessageAction(message);

        if (angular.isString(parameters.Message.ToList)) {
            parameters.Message.ToList = [];
        }

        if (angular.isString(parameters.Message.CCList)) {
            parameters.Message.CCList = [];
        }

        if (angular.isString(parameters.Message.BCCList)) {
            parameters.Message.BCCList = [];
        }

        if (angular.isDefined(message.ParentID)) {
            parameters.ParentID = message.ParentID;
            parameters.Action = message.Action;
        }

        if (angular.isDefined(message.ID)) {
            parameters.id = message.ID;
        } else {
            parameters.Message.IsRead = 1;
        }

        if (autosaving === false) {
            parameters.Message.IsRead = 1;
        }

        const { DisplayName: Name, Email: Address } = message.From || {};
        parameters.Message.Sender = {
            // Default empty DisplayName is null
            Name: Name || '',
            Address
        };

        const [{ PublicKey } = {}] = message.From.Keys || [];

        parameters.AttachmentKeyPackets = await message.encryptAttachmentKeyPackets(PublicKey);

        // NOTE we set the AddressID once AttachmentKeyPackets is done
        message.AddressID = message.From.ID;
        parameters.Message.AddressID = message.From.ID;

        return parameters;
    };

    const saveDraft = async (localMessage, { actionType, parameters, notification }) => {
        const { Message: remoteMessage, Code } = await messageRequest.draft(parameters, localMessage, actionType);

        if (Code === ComposerRequestStatus.SUCCESS) {
            const conversation = cache.getConversationCached(remoteMessage.ConversationID) || {};
            const contextNumUnread = conversation.ContextNumUnread || 0;
            let numMessages;

            if (actionType === STATUS.CREATE) {
                numMessages = (conversation.NumMessages || 0) + 1;
                localMessage.ID = remoteMessage.ID;
            } else if (actionType === STATUS.UPDATE) {
                numMessages = conversation.NumMessages || 0;
            }

            localMessage.IsRead = remoteMessage.IsRead;
            localMessage.Time = remoteMessage.Time;
            localMessage.Type = remoteMessage.Type;
            localMessage.LabelIDs = remoteMessage.LabelIDs;

            const pgpAttachments = actionType === STATUS.CREATE ? await uploadPGPMimeAttachments(localMessage) : {};

            if (remoteMessage.Attachments.length > 0) {
                localMessage.Attachments = syncAttachmentsRemote(localMessage, remoteMessage);
            }

            localMessage.Attachments = _.map(
                localMessage.Attachments,
                (attachment) => pgpAttachments[attachment.ID] || attachment
            );
            localMessage.Attachments = _.uniqBy(localMessage.Attachments, ({ ID }) => ID);

            // signs the attachments in place :-)
            await signAttachments(localMessage);

            localMessage.NumAttachments = localMessage.Attachments.length;
            localMessage.NumEmbedded = localMessage.countEmbedded();

            remoteMessage.Senders = [remoteMessage.Sender]; // The back-end doesn't return Senders so need a trick
            remoteMessage.Recipients = _.uniq(remoteMessage.ToList.concat(remoteMessage.CCList, remoteMessage.BCCList)); // The back-end doesn't return Recipients

            // Generate conversation event
            const firstConversation = {
                Recipients: remoteMessage.Recipients,
                Senders: remoteMessage.Senders,
                Subject: remoteMessage.Subject
            };

            // Update draft in message list
            const events = [{ Action: actionType, ID: remoteMessage.ID, Message: remoteMessage }];

            // Generate conversation event
            events.push({
                Action: STATUS.UPDATE_FLAGS,
                ID: remoteMessage.ConversationID,
                Conversation: angular.extend(
                    {
                        NumAttachments: localMessage.Attachments.length, // it's fine
                        NumMessages: numMessages,
                        ContextNumUnread: contextNumUnread,
                        ID: remoteMessage.ConversationID,
                        LabelIDsAdded: [MAILBOX_IDENTIFIERS.allDrafts, MAILBOX_IDENTIFIERS.drafts]
                    },
                    numMessages === 1 ? firstConversation : {}
                )
            });

            // Send events
            cache.events(events);

            if (notification === true) {
                notify({ message: I18N.SAVE_MESSAGE_SUCCESS, classes: 'notification-success' });
            }

            localMessage.saving = false;
            localMessage.autosaving = false;
            dispatchMessageAction(localMessage);

            // this output is not even used?
            return localMessage;
        }

        if (Code === ComposerRequestStatus.DRAFT_NOT_EXIST) {
            // Case where the user delete draft in an other terminal
            delete parameters.id;
            const { data = {} } = await messageApi.createDraft(parameters);
            return data.Message;
        }
    };

    const encryptBody = async (message) => {
        if (!message.isPlainText()) {
            // Only parse embedded and reset the body IF it is not a plaintext message.
            // Otherwise it won't contain any HTML, and it can escape things it shouldn't.
            const body = await embedded.parser(message, {
                direction: 'cid',
                isOutside: outsidersMap.get(message.ID)
            });
            message.setDecryptedBody(body);
        }
        return message.encryptBody(message.From.Keys[0].PublicKey);
    };

    const save = async (message, { notification, autosaving, encrypt }) => {
        try {
            const parameters = await makeParams(message, autosaving);

            const [{ ID } = {}] = await composerRequestModel.chain(message);

            if (ID) {
                message.ID = ID;
                parameters.id = ID;
            }

            const actionType = message.ID ? STATUS.UPDATE : STATUS.CREATE;
            parameters.Message.Body = encrypt ? await encryptBody(message) : message.Body;

            return await saveDraft(message, { actionType, parameters, notification });
        } catch (error) {
            message.saving = false;
            message.autosaving = false;
            dispatchMessageAction(message);
            composerRequestModel.clear(message);
            throw error;
        }
    };

    /**
     * Save the Message
     * @param {Resource} message - Message to save
     * @param {Boolean} notification - Add a notification when the saving is complete
     * @param {Boolean} autosaving
     * @param {Boolean} loader
     * @param {Boolean} encryptBody an already pre-encrypted body, to prevent re-encrypting the body (for de-duplication).
     */
    const recordMessage = async (
        message,
        { notification = false, autosaving = false, loader = true, encrypt = true } = {}
    ) => {
        try {
            const promise = save(message, { notification, autosaving, encrypt });

            if (autosaving === false || loader) {
                networkActivityTracker.track(promise);
            }

            composerRequestModel.save(message, promise);
            return await promise;
        } catch (error) {
            const message = unicodeTagView(error.message);
            if (autosaving) {
                return notify({ message, classes: 'notification-danger' });
            }
            throw new Error(message);
        }
    };

    return recordMessage;
}
export default postMessage;

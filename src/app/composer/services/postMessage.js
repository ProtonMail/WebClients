import _ from 'lodash';

import { STATUS, MAILBOX_IDENTIFIERS } from '../../constants';
import { API_CUSTOM_ERROR_CODES } from '../../errors';
import { getConversationLabels } from '../../conversation/helpers/conversationHelpers';

/* @ngInject */
function postMessage(
    dispatchers,
    messageRequest,
    cache,
    notification,
    gettextCatalog,
    composerRequestModel,
    embedded,
    outsidersMap,
    networkActivityTracker,
    AttachmentLoader,
    attachmentModel,
    embeddedUtils,
    recipientsFormator,
    translator
) {
    const I18N = translator(() => ({
        SAVE_MESSAGE_SUCCESS: gettextCatalog.getString('Message saved', null, 'Record message')
    }));
    const { dispatcher } = dispatchers(['actionMessage', 'composer.update']);
    const notify = notification;

    const dispatchMessageAction = (message) => dispatcher.actionMessage('update', message);
    const dispatchComposerUpdate = (type, data = {}) => dispatcher['composer.update'](type, data);

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

    const makeParams = async (message) => {
        const parameters = {
            Message: _.pick(message, 'ToList', 'CCList', 'BCCList', 'Subject', 'Unread', 'MIMEType', 'Flags')
        };

        parameters.Message.Subject = parameters.Message.Subject || '';

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
            parameters.Message.Unread = 0;
        }

        if (!message.autosaving === false) {
            parameters.Message.Unread = 0;
        }

        const { DisplayName: Name, Email: Address } = message.From || {};
        parameters.Message.Sender = {
            // Default empty DisplayName is null
            Name: Name || '',
            Address
        };

        const { ToList, CCList, BCCList } = await recipientsFormator.format(parameters.Message, message);

        parameters.Message.ToList = ToList;
        parameters.Message.CCList = CCList;
        parameters.Message.BCCList = BCCList;

        const [{ PublicKey } = {}] = message.From.Keys || [];

        parameters.AttachmentKeyPackets = await message.encryptAttachmentKeyPackets(PublicKey);

        // NOTE we set the AddressID once AttachmentKeyPackets is done
        message.AddressID = message.From.ID;
        parameters.Message.AddressID = message.From.ID;

        return parameters;
    };

    const saveDraft = async (localMessage, { actionType, parameters, notification }) => {
        try {
            const { Message: remoteMessage } = await messageRequest.draft(parameters, localMessage, actionType);

            const conversation = cache.getConversationCached(remoteMessage.ConversationID) || {};
            const { Labels = [], ContextNumUnread = 0 } = conversation;

            let numMessages;

            if (actionType === STATUS.CREATE) {
                numMessages = (conversation.NumMessages || 0) + 1;
                localMessage.ID = remoteMessage.ID;
            } else if (actionType === STATUS.UPDATE) {
                numMessages = conversation.NumMessages || 0;
            }

            localMessage.Unread = remoteMessage.Unread;
            localMessage.Time = remoteMessage.Time;
            localMessage.Type = remoteMessage.Type;
            localMessage.LabelIDs = remoteMessage.LabelIDs;

            if (remoteMessage.Attachments.length > 0) {
                localMessage.Attachments = syncAttachmentsRemote(localMessage, remoteMessage);
            }

            // signs the attachments in place :-)
            await signAttachments(localMessage);

            localMessage.NumAttachments = localMessage.Attachments.length;
            localMessage.NumEmbedded = localMessage.countEmbedded();
            localMessage.AddressID = remoteMessage.AddressID;

            // The back-end doesn't return these keys
            remoteMessage.Senders = [remoteMessage.Sender];
            remoteMessage.Recipients = recipientsFormator.toList(remoteMessage);

            // Generate conversation event
            const firstConversation = {
                Recipients: remoteMessage.Recipients,
                Senders: remoteMessage.Senders,
                Subject: remoteMessage.Subject
            };

            // Update draft in message list
            const events = [
                {
                    Action: actionType,
                    ID: remoteMessage.ID,
                    Message: remoteMessage
                }
            ];

            // Generate conversation event
            events.push({
                Action: STATUS.UPDATE_FLAGS,
                ID: remoteMessage.ConversationID,
                Conversation: angular.extend(
                    {
                        NumAttachments: localMessage.Attachments.length, // it's fine
                        NumMessages: numMessages,
                        ContextNumUnread,
                        ID: remoteMessage.ConversationID,
                        Labels: getConversationLabels(
                            { ContextNumUnread, Labels },
                            {
                                toAdd: [MAILBOX_IDENTIFIERS.allDrafts, MAILBOX_IDENTIFIERS.drafts]
                            }
                        )
                    },
                    numMessages === 1 ? firstConversation : {}
                )
            });

            // Send events
            cache.events(events);

            if (notification === true) {
                notify.success(I18N.SAVE_MESSAGE_SUCCESS);
            }

            localMessage.saving = false;
            localMessage.autosaving = false;
            dispatchMessageAction(localMessage);

            // this output is not even used?
            return localMessage;
        } catch (e) {
            const { data = {} } = e;

            // Case where the message has already been sent
            if (data.Code === API_CUSTOM_ERROR_CODES.MESSAGE_UPDATE_DRAFT_NOT_DRAFT) {
                return dispatchComposerUpdate('close.message', { message: localMessage });
            }

            throw e;
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
            message.saving = true;
            message.autosaving = autosaving;

            const parameters = await makeParams(message, autosaving);

            if (message.ID) {
                parameters.id = message.ID;
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
    const recordMessage = (
        message,
        { notification = false, autosaving = false, loader = true, encrypt = true } = {}
    ) => {
        const callback = () => {
            const promise = save(message, { notification, autosaving, encrypt });

            if (!autosaving || loader) {
                networkActivityTracker.track(promise);
            }

            return promise;
        };

        return composerRequestModel.add(message, callback);
    };

    return recordMessage;
}
export default postMessage;

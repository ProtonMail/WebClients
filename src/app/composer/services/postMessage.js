import _ from 'lodash';

/* @ngInject */
function postMessage(
    CONSTANTS,
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
    $filter
) {
    const { STATUS } = CONSTANTS;
    const I18N = {
        SAVE_MESSAGE_SUCCESS: gettextCatalog.getString('Message saved', null, 'Record message')
    };
    const unicodeTagView = $filter('unicodeTagView');
    const dispatchMessageAction = (message) => $rootScope.$emit('actionMessage', { data: message });

    /**
     * Extend local attachements for a message with remote's
     * @param  {Array} collection Attachements from the message
     * @param  {Array} list       Attachements from the remote
     * @return {Array}            Merge
     */
    function syncAttachmentsRemote(collection, list) {
        const map = collection.reduce((acc, att) => {
            acc[att.ID] = att;
            att.AttachmentID && (acc[att.AttachmentID] = att);
            return acc;
        }, {});
        return list.reduce((acc, att = {}) => {
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

        const [ { PublicKey } = {} ] = message.From.Keys || [];

        parameters.AttachmentKeyPackets = await message.encryptAttachmentKeyPackets(PublicKey);

        // NOTE we set the AddressID once AttachmentKeyPackets is done
        message.AddressID = message.From.ID;
        parameters.Message.AddressID = message.From.ID;

        return parameters;
    };

    const saveDraft = async (message, { actionType, parameters, notification }) => {
        const data = await messageRequest.draft(parameters, message, actionType);
        const { Message, Code } = data;

        if (Code === ComposerRequestStatus.SUCCESS) {
            const conversation = cache.getConversationCached(Message.ConversationID) || {};
            const contextNumUnread = conversation.ContextNumUnread || 0;
            let numMessages;

            if (actionType === STATUS.CREATE) {
                numMessages = (conversation.NumMessages || 0) + 1;
                message.ID = Message.ID;
            } else if (actionType === STATUS.UPDATE) {
                numMessages = conversation.NumMessages || 0;
            }

            message.IsRead = Message.IsRead;
            message.Time = Message.Time;
            message.Type = Message.Type;
            message.LabelIDs = Message.LabelIDs;

            if (Message.Attachments.length > 0) {
                message.Attachments = syncAttachmentsRemote(message.Attachments, Message.Attachments);
            }

            Message.Senders = [Message.Sender]; // The back-end doesn't return Senders so need a trick
            Message.Recipients = _.uniq(Message.ToList.concat(Message.CCList, Message.BCCList)); // The back-end doesn't return Recipients

            // Generate conversation event
            const firstConversation = {
                Recipients: Message.Recipients,
                Senders: Message.Senders,
                Subject: Message.Subject
            };

            // Update draft in message list
            const events = [{ Action: actionType, ID: Message.ID, Message }];

            // Generate conversation event
            events.push({
                Action: STATUS.UPDATE_FLAGS,
                ID: Message.ConversationID,
                Conversation: angular.extend(
                    {
                        NumAttachments: Message.Attachments.length, // it's fine
                        NumMessages: numMessages,
                        ContextNumUnread: contextNumUnread,
                        ID: Message.ConversationID,
                        LabelIDsAdded: [CONSTANTS.MAILBOX_IDENTIFIERS.allDrafts, CONSTANTS.MAILBOX_IDENTIFIERS.drafts]
                    },
                    numMessages === 1 ? firstConversation : {}
                )
            });

            // Send events
            cache.events(events);

            if (notification === true) {
                notify({ message: I18N.SAVE_MESSAGE_SUCCESS, classes: 'notification-success' });
            }

            message.saving = false;
            message.autosaving = false;
            dispatchMessageAction(message);
            return Message;
        }

        if (Code === ComposerRequestStatus.DRAFT_NOT_EXIST) {
            // Case where the user delete draft in an other terminal
            delete parameters.id;
            const { data = {} } = await messageApi.createDraft(parameters);
            return data.Message;
        }
    };

    const save = async (message, { notification, autosaving }) => {
        try {
            const parameters = await makeParams(message, autosaving);

            const [{ ID } = {}] = await composerRequestModel.chain(message);

            if (ID) {
                message.ID = ID;
                parameters.id = ID;
            }

            if (!message.isPlainText()) {
                // Only parse embedded and reset the body IF it is not a plaintext message.
                // Otherwise it won't contain any HTML, and it can escape things it shouldn't.
                const body = await embedded.parser(message, {
                    direction: 'cid',
                    isOutside: outsidersMap.get(message.ID)
                });
                message.setDecryptedBody(body);
            }

            const encryptedBody = await message.encryptBody(message.From.Keys[0].PublicKey);
            const actionType = message.ID ? STATUS.UPDATE : STATUS.CREATE;
            parameters.Message.Body = encryptedBody;

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
     */
    const recordMessage = async (message, { notification = false, autosaving = false, loader = true } = {}) => {
        try {
            const promise = save(message, { notification, autosaving });

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

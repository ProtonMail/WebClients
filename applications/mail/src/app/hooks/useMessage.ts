import { useEffect, useCallback, useState } from 'react';
import { c } from 'ttag';
import { useApi, useEventManager } from 'react-components';
import { getMessage, markMessageAsRead, deleteMessages } from 'proton-shared/lib/api/messages';
import { wait } from 'proton-shared/lib/helpers/promise';
import { Api } from 'proton-shared/lib/interfaces';

import { transformEscape } from '../helpers/transforms/transformEscape';
import { transformLinks } from '../helpers/transforms/transformLinks';
import { transformEmbedded } from '../helpers/transforms/transformEmbedded';
import { transformWelcome } from '../helpers/transforms/transformWelcome';
import { transformStylesheet } from '../helpers/transforms/transformStylesheet';
import { transformRemote } from '../helpers/transforms/transformRemote';
import { transformBase } from '../helpers/transforms/transformBase';
import { useDecryptMessage } from './useDecryptMessage';
import { Message, MessageExtended } from '../models/message';
import { useSendMessage } from './useSendMessage';
import { MailSettings } from '../models/utils';
import { useMessageKeys } from './useMessageKeys';
import { useBase64Cache, Base64Cache } from './useBase64Cache';
import { updateMessage, createMessage } from '../helpers/message/messageExport';
import { AttachmentsCache, useAttachmentCache } from '../containers/AttachmentProvider';
import {
    ATTACHMENT_ACTION,
    getUpdateAttachmentsComputation,
    UploadResult
} from '../helpers/attachment/attachmentUploader';
import { useMessageCache } from '../containers/MessageProvider';
import { setContent, getContent } from '../helpers/message/messageContent';

export interface ComputationOption {
    mailSettings: MailSettings;
    api: Api;
    attachmentsCache: AttachmentsCache;
    base64Cache: Base64Cache;
}

export interface Computation {
    (message: MessageExtended, options: ComputationOption):
        | Promise<Partial<MessageExtended>>
        | Partial<MessageExtended>;
}

interface MessageActions {
    load: () => Promise<void>;
    initialize: () => Promise<void>;
    loadRemoteImages: () => Promise<void>;
    loadEmbeddedImages: () => Promise<void>;
    createDraft: (message: MessageExtended) => Promise<void>;
    saveDraft: (message: MessageExtended) => Promise<void>;
    send: (message: MessageExtended) => Promise<void>;
    deleteDraft: () => Promise<void>;
    updateAttachments: (uploads: UploadResult[], action: ATTACHMENT_ACTION) => Promise<MessageExtended>;
}

interface MessageActivity {
    lock: boolean;
    current: string;
}

/**
 * Apply updates from the message model to the message in state
 */
export const mergeMessages = (messageState: MessageExtended, messageModel: MessageExtended) => {
    if (messageState.document) {
        setContent(messageState, getContent(messageModel));
    }
    const message = {
        ...messageState,
        data: { ...messageState.data, ...messageModel.data }
    };
    return message;
};

/**
 * Only takes technical stuff from the updated message
 */
export const mergeSavedMessage = (messageSaved: Message = {}, messageReturned: Message) => ({
    ...messageSaved,
    ID: messageReturned.ID,
    Time: messageReturned.Time,
    ContextTime: messageReturned.ContextTime,
    ConversationID: messageReturned.ConversationID
});

export const useMessage = (
    inputMessage: Message = {},
    mailSettings: any
): [MessageExtended, MessageActions, MessageActivity] => {
    const api = useApi();
    const { call } = useEventManager();
    const cache = useMessageCache();
    const base64Cache = useBase64Cache();
    const attachmentsCache = useAttachmentCache();

    // messageID change ONLY when a draft is created
    const [messageID, setMessageID] = useState(inputMessage.ID || '');
    const [message, setMessage] = useState<MessageExtended>(
        cache.has(messageID) ? cache.get(messageID) : { data: inputMessage }
    );
    const [messageActivity, setMessageActivity] = useState<MessageActivity>({ lock: false, current: '' });

    const keys = useMessageKeys();
    const decrypt = useDecryptMessage();
    const sendMessage = useSendMessage();

    // Update messageID if component is reused for another message
    useEffect(() => {
        if (!!inputMessage.ID && inputMessage.ID !== messageID) {
            setMessageID(inputMessage.ID);
        }
    }, [inputMessage]);

    // Update message state and listen to cache for updates on the current message
    useEffect(() => {
        if (cache.has(messageID)) {
            setMessage(cache.get(messageID));
        } else {
            const message = { data: inputMessage };
            cache.set(messageID, message);
            setMessage(message);
        }

        return cache.subscribe((changedMessageID) => {
            // Prevent updates on message deltion from the cache to prevent undefined message in state.
            if (changedMessageID === messageID && cache.has(messageID)) {
                setMessage(cache.get(messageID));
            }
        });
    }, [messageID, cache]);

    const loadData = useCallback(
        async ({ data: message = {} }: MessageExtended) => {
            // If the Body is already there, no need to send a request
            if (!message.Body) {
                const { Message } = await api(getMessage(message.ID));
                return { data: Message as Message };
            }
            return {} as MessageExtended;
        },
        [api]
    );

    const markAsRead = useCallback(
        async ({ data: message = {} }: MessageExtended) => {
            const markAsRead = async () => {
                await api(markMessageAsRead([message.ID || '']));
                await call();
            };

            if (message.Unread) {
                markAsRead(); // No await to not slow down the UX
                return { data: { ...message, Unread: 0 } } as MessageExtended;
            }

            return {} as MessageExtended;
        },
        [api]
    );

    const create = useCallback(
        async (message: MessageExtended = {}) => {
            const newMessage = await createMessage(message, api);
            await call();
            return { data: mergeSavedMessage(message.data, newMessage) };
        },
        [api]
    );

    const update = useCallback(
        async (message: MessageExtended = {}) => {
            const newMessage = await updateMessage(message, api);
            await call();
            return { data: mergeSavedMessage(message.data, newMessage) };
        },
        [api]
    );

    const deleteRequest = useCallback(
        async (message: MessageExtended = {}) => {
            await api(deleteMessages([message.data?.ID]));
            await call();
            return {};
        },
        [api]
    );

    const transforms = [
        transformEscape,
        transformBase,
        transformLinks,
        transformEmbedded,
        transformWelcome,
        transformStylesheet,
        transformRemote
    ] as Computation[];

    const activities = new Map<Computation, string>([
        [create, c('Action').t`Creating`],
        [update, c('Action').t`Saving`],
        [sendMessage, c('Action').t`Sending`],
        [deleteRequest, c('Action').t`Deleting`]
    ]);
    transforms.forEach((transform) => activities.set(transform, c('Action').t`Processing`));

    /**
     * Run a computation on a message, wait until it finish
     * Return the message extanded with the result of the computation
     */
    const runSingle = useCallback(
        async (message: MessageExtended, compute: Computation) => {
            let current = '';
            if (activities.has(compute)) {
                current = activities.get(compute) as string;
            }
            setMessageActivity({ lock: true, current });

            const result = (await compute(message, { base64Cache, mailSettings, api, attachmentsCache })) || {};

            return { ...message, ...result } as MessageExtended;
        },
        [cache]
    );

    type CacheUpdate = (newMessage: MessageExtended) => Promise<void> | void;

    const simpleUpdateCache: CacheUpdate = (newMessage: MessageExtended) => {
        cache.set(messageID, newMessage);
    };

    /**
     * Run a list of computation sequentially
     * updateCacheCallback is used to update the cache value after computations but before unlocking the message
     * A callback is needed here because it's better to position precisely the moment where to update the cache
     */
    const run = useCallback(
        async (
            message: MessageExtended,
            computes: Computation[],
            updateCacheCallback: CacheUpdate = simpleUpdateCache
        ) => {
            setMessageActivity({ lock: true, current: '' });
            const result = await computes.reduce(
                async (messagePromise: Promise<MessageExtended>, compute: Computation) => {
                    return runSingle(await messagePromise, compute);
                },
                Promise.resolve(message)
            );
            await updateCacheCallback(result);
            // Allow the cache update to be dispatched in React before resolving (simplify several race conditions)
            await wait(0);
            setMessageActivity({ lock: false, current: '' });
            return result;
        },
        [runSingle, cache]
    );

    const load = useCallback(async () => {
        await run(message, [loadData]);
    }, [messageID, message, run, cache]);

    const initialize = useCallback(async () => {
        cache.set(messageID, { ...message, initialized: false });
        await run(message, [loadData, keys, decrypt, markAsRead, ...transforms], (newMessage: MessageExtended) =>
            cache.set(messageID, { ...newMessage, initialized: true })
        );
    }, [messageID, message, run, cache]);

    const loadRemoteImages = useCallback(async () => {
        await run({ ...message, showRemoteImages: true }, [transformRemote as Computation]);
    }, [messageID, message, message, run, cache]);

    const loadEmbeddedImages = useCallback(async () => {
        await run({ ...message, showEmbeddedImages: true }, [transformEmbedded]);
    }, [messageID, message, run, cache]);

    const createDraft = useCallback(
        async (message: MessageExtended) => {
            await run(message, [keys, create] as Computation[], (newMessage: MessageExtended) => {
                cache.set(newMessage.data?.ID || '', newMessage);
                setMessageID(newMessage.data?.ID || '');
            });
        },
        [message, run, cache]
    );

    const saveDraft = useCallback(
        async (messageModel: MessageExtended) => {
            await run(mergeMessages(message, messageModel), [update]);
        },
        [message, run, cache]
    );

    const send = useCallback(
        async (messageModel: MessageExtended) => {
            await run(mergeMessages(message, messageModel), [sendMessage]);
        },
        [message, run, cache]
    );

    const deleteDraft = useCallback(async () => {
        await run(message, [deleteRequest], () => cache.delete(messageID));
    }, [message, run, cache]);

    const updateAttachments = useCallback(
        async (uploads: UploadResult[], action = ATTACHMENT_ACTION.ATTACHMENT) => {
            const computation = getUpdateAttachmentsComputation(uploads, action);
            return await run(message, [computation]);
        },
        [message, run, cache]
    );

    return [
        message,
        {
            load,
            initialize,
            loadRemoteImages,
            loadEmbeddedImages,
            createDraft,
            saveDraft,
            send,
            deleteDraft,
            updateAttachments
        },
        messageActivity
    ];
};

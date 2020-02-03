import { useEffect, useCallback, useState, useMemo, useContext } from 'react';
import { c } from 'ttag';
import { useApi, useEventManager } from 'react-components';
import {
    getMessage,
    markMessageAsRead,
    createDraft as createDraftApi,
    updateDraft,
    deleteMessages
} from 'proton-shared/lib/api/messages';
import { wait } from 'proton-shared/lib/helpers/promise';

import { transformEscape } from '../helpers/transforms/transformEscape';
import { transformLinks } from '../helpers/transforms/transformLinks';
import { transformEmbedded } from '../helpers/transforms/transformEmbedded';
import { transformWelcome } from '../helpers/transforms/transformWelcome';
import { transformBlockquotes } from '../helpers/transforms/transformBlockquotes';
import { transformStylesheet } from '../helpers/transforms/transformStylesheet';
import { transformRemote } from '../helpers/transforms/transformRemote';
import { transformBase } from '../helpers/transforms/transformBase';
import { useDecryptMessage } from './useDecryptMessage';
import { AttachmentsCache, useAttachmentsCache } from './useAttachments';
import { Message, MessageExtended } from '../models/message';
import { useSendMessage } from './useSendMessage';
import { MailSettings, Api } from '../models/utils';
import { useEncryptMessage } from './useEncryptMessage';
import { MESSAGE_ACTIONS } from '../constants';
import { MessageContext } from '../containers/MessageProvider';

export interface ComputationOption {
    cache: any;
    mailSettings: MailSettings;
    api: Api;
    attachmentsCache: AttachmentsCache;
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
        messageState.document.innerHTML = messageModel.content || '';
    }
    const message = {
        ...messageState,
        content: messageModel.content,
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
    ParentID: messageReturned.ParentID,
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
    const cache = useContext(MessageContext);
    const computeCache = useMemo(() => new Map(), []);
    const attachmentsCache = useAttachmentsCache();

    // messageID change ONLY when a draft is created
    const [messageID, setMessageID] = useState(inputMessage.ID || '');
    const [message, setMessage] = useState<MessageExtended>(
        cache.has(messageID) ? cache.get(messageID) : { data: inputMessage }
    );
    const [messageActivity, setMessageActivity] = useState<MessageActivity>({ lock: false, current: '' });

    const decrypt = useDecryptMessage();
    const encrypt = useEncryptMessage();
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

    const transforms = [
        transformEscape,
        transformBase,
        transformLinks,
        transformEmbedded,
        transformWelcome,
        transformBlockquotes,
        transformStylesheet,
        transformRemote
    ] as Computation[];

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
                call();
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
            const { Message } = await api(
                createDraftApi({
                    Action: message.action !== MESSAGE_ACTIONS.NEW ? message.action : undefined,
                    Message: message.data
                } as any)
            );
            call();
            return { data: mergeSavedMessage(message.data, Message) };
        },
        [api]
    );

    const update = useCallback(
        async (message: MessageExtended = {}) => {
            const { Message } = await api(updateDraft(message.data?.ID, message.data));
            call();
            return { data: mergeSavedMessage(message.data, Message) };
        },
        [api]
    );

    const deleteRequest = useCallback(
        async (message: MessageExtended = {}) => {
            await api(deleteMessages([message.data?.ID]));
            call();
            return {};
        },
        [api]
    );

    const activities = new Map<Computation, string>([
        [encrypt, c('Action').t`Encrypting`],
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

            const result = (await compute(message, { cache: computeCache, mailSettings, api, attachmentsCache })) || {};

            if (result.document) {
                result.content = result.document.innerHTML;
            }

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
        await run(
            message,
            [loadData, decrypt, markAsRead, ...transforms] as Computation[],
            (newMessage: MessageExtended) => cache.set(messageID, { ...newMessage, initialized: true })
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
            await run(message, [encrypt, create] as Computation[], (newMessage: MessageExtended) => {
                cache.set(newMessage.data?.ID || '', newMessage);
                setMessageID(newMessage.data?.ID || '');
            });
        },
        [message, run, cache]
    );

    const saveDraft = useCallback(
        async (messageModel: MessageExtended) => {
            await run(mergeMessages(message, messageModel), [encrypt, update]);
        },
        [message, run, cache]
    );

    const send = useCallback(
        async (messageModel: MessageExtended) => {
            await run(mergeMessages(message, messageModel), [encrypt, update, sendMessage]);
        },
        [message, run, cache]
    );

    const deleteDraft = useCallback(async () => {
        await run(message, [deleteRequest], () => cache.delete(messageID));
    }, [message, run, cache]);

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
            deleteDraft
        },
        messageActivity
    ];
};

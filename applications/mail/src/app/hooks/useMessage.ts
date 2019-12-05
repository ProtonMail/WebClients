import { useContext, useEffect, useCallback, useState, useMemo } from 'react';
import { transformEscape } from '../helpers/transforms/transformEscape';
import { transformLinks } from '../helpers/transforms/transformLinks';
import { transformEmbedded } from '../helpers/transforms/transformEmbedded';
import { transformWelcome } from '../helpers/transforms/transformWelcome';
import { transformBlockquotes } from '../helpers/transforms/transformBlockquotes';
import { transformStylesheet } from '../helpers/transforms/transformStylesheet';
import { transformRemote } from '../helpers/transforms/transformRemote';
import { transformBase } from '../helpers/transforms/transformBase';
import { useDecryptMessage } from './useDecryptMessage';
import { useTransformAttachments } from './useAttachments';
import { MessageContext } from '../containers/MessageProvider';
import { Message, MessageExtended } from '../models/message';
import { getMessage, markMessageAsRead } from 'proton-shared/lib/api/messages';
import { useApi, useEventManager } from 'react-components';

interface ComputationOption {
    action?: string;
    cache: any;
    mailSettings: any;
}

interface Computation {
    (message: MessageExtended, options: ComputationOption):
        | Promise<Partial<MessageExtended>>
        | Partial<MessageExtended>;
}

interface MessageActions {
    load: () => Promise<void>;
    initialize: () => Promise<void>;
    loadRemoteImages: () => Promise<void>;
    loadEmbeddedImages: () => Promise<void>;
}

export const useMessage = (inputMessage: Message, mailSettings: any): [MessageExtended, MessageActions] => {
    const messageID = inputMessage.ID || '';

    const api = useApi();
    const { call } = useEventManager();
    const cache = useContext(MessageContext);
    const computeCache = useMemo(() => new Map(), []);
    const [message, setMessage] = useState<MessageExtended>(
        cache.has(messageID) ? cache.get(messageID) : { data: inputMessage }
    );

    const decrypt = useDecryptMessage();
    const transformAttachements = useTransformAttachments();

    // Listen to cache for updates on the current message
    useEffect(
        () =>
            cache.subscribe((changedMessageID) => {
                if (changedMessageID === messageID) {
                    setMessage(cache.get(messageID));
                }
            }),
        [messageID, cache]
    );

    const transforms = [
        transformEscape,
        transformBase,
        transformLinks,
        transformEmbedded,
        transformWelcome,
        transformBlockquotes,
        transformStylesheet,
        transformAttachements,
        transformRemote
    ];

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

    /**
     * Run a computation on a message, wait until it finish
     * Return the message extanded with the result of the computation
     */
    const runSingle = useCallback(
        async (message: MessageExtended, compute: Computation, action?: string) => {
            const result = (await compute(message, { action, cache: computeCache, mailSettings })) || {};

            if (result.document) {
                result.content = result.document.innerHTML;
            }

            return { ...message, ...result } as MessageExtended;
        },
        [cache]
    );

    /**
     * Run a list of computation sequentially
     */
    const run = useCallback(
        async (message: MessageExtended, computes: Computation[], action?: string) => {
            return computes.reduce(async (messagePromise: Promise<MessageExtended>, compute: Computation) => {
                return runSingle(await messagePromise, compute, action);
            }, Promise.resolve(message));
        },
        [runSingle, cache]
    );

    const load = useCallback(async () => {
        const newMessage = await run(message, [loadData]);
        cache.set(messageID, { ...newMessage, loaded: true });
    }, [messageID, run, cache]);

    const initialize = useCallback(
        async (action?) => {
            const newMessage = await run(
                message,
                [loadData, decrypt, markAsRead, ...transforms] as Computation[],
                action
            );
            cache.set(messageID, { ...newMessage, initialized: true });
        },
        [messageID, run, cache]
    );

    const loadRemoteImages = useCallback(
        async (action?) => {
            const newMessage = await run(
                { ...message, showRemoteImages: true },
                [transformRemote as Computation],
                action
            );
            cache.set(messageID, newMessage);
        },
        [messageID, run, cache]
    );

    const loadEmbeddedImages = useCallback(
        async (action?) => {
            const newMessage = await run(
                { ...message, showEmbeddedImages: true },
                [transformEmbedded, transformAttachements] as Computation[],
                action
            );
            cache.set(messageID, newMessage);
        },
        [messageID, run, cache]
    );

    return [
        message,
        {
            load,
            initialize,
            loadRemoteImages,
            loadEmbeddedImages
        }
    ];
};

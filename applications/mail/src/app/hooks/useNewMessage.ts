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
import { useMessages } from './useMessages';
import { useMarkAsRead } from './useMarkAsRead';
import { useTransformAttachments } from './useAttachments';
import { MessageContext } from '../containers/MessageProvider';
import { Message, MessageExtended } from '../models/message';

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
    initialize: () => Promise<void>;
    loadRemoteImages: () => Promise<void>;
    loadEmbeddedImages: () => Promise<void>;
}

export const useMessage = (inputMessage: Message, mailSettings: any): [MessageExtended, MessageActions] => {
    const messageID = inputMessage.ID || '';

    const cache = useContext(MessageContext);
    const computeCache = useMemo(() => new Map(), []);
    const [message, setMessage] = useState<MessageExtended>(
        cache.has(messageID) ? cache.get(messageID) : { data: inputMessage }
    );

    const { ensureBody } = useMessages();
    const markAsRead = useMarkAsRead();
    const decrypt = useDecryptMessage();
    const transformAttachements = useTransformAttachments();

    // Put in state the message from the cache
    useEffect(() => {
        const updateMessage = () => {
            if (!cache.has(messageID)) {
                cache.set(messageID, { data: inputMessage });
            }

            setMessage(cache.get(messageID));
        };

        updateMessage();

        return cache.subscribe((changedMessageID) => {
            if (changedMessageID === messageID) {
                updateMessage();
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
        transformAttachements,
        transformRemote
    ];

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

    const initialize = useCallback(
        async (action?) => {
            const message = cache.get(messageID);
            const newMessage = await run(message, [ensureBody, decrypt, markAsRead, ...transforms], action);
            cache.set(messageID, { ...newMessage, initialized: true });
        },
        [run, cache]
    );

    const loadRemoteImages = useCallback(
        async (action?) => {
            const message = cache.get(messageID);
            const newMessage = await run(
                { ...message, showRemoteImages: true },
                [transformRemote as Computation],
                action
            );
            cache.set(messageID, newMessage);
        },
        [run, cache]
    );

    const loadEmbeddedImages = useCallback(
        async (action?) => {
            const message = cache.get(messageID);
            const newMessage = await run(
                { ...message, showEmbeddedImages: true },
                [transformEmbedded, transformAttachements],
                action
            );
            cache.set(messageID, newMessage);
        },
        [run, cache]
    );

    return [
        message,
        {
            initialize,
            loadRemoteImages,
            loadEmbeddedImages
        } as MessageActions
    ];
};

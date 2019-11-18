import { useCallback } from 'react';
import { useCache } from 'react-components';
import { transformEscape } from '../helpers/transforms/transformEscape';
import { transformLinks } from '../helpers/transforms/transformLinks';
import { transformEmbedded } from '../helpers/transforms/transformEmbedded';
import { transformWelcome } from '../helpers/transforms/transformWelcome';
import { transformBlockquotes } from '../helpers/transforms/transformBlockquotes';
import { transformStylesheet } from '../helpers/transforms/transformStylesheet';
import { transformRemote } from '../helpers/transforms/transformRemote';
import { transformBase } from '../helpers/transforms/transformBase';
import { useDecryptMessage } from './useDecryptMessage';
import { useLoadMessage } from './useLoadMessage';
import { useMarkAsRead } from './useMarkAsRead';
import { useTransformAttachments } from './useAttachments';
import { MessageExtended } from '../models/message';

// Reference: Angular/src/app/message/services/prepareContent.js

interface ComputationOption {
    action?: string;
    cache: any;
    mailSettings: any;
}

interface Computation {
    (message: MessageExtended, options: ComputationOption): Promise<MessageExtended> | MessageExtended;
}

export const useComputeMessage = (mailSettings: any) => {
    const cache = useCache();
    const load = useLoadMessage();
    const markAsRead = useMarkAsRead();
    const decrypt = useDecryptMessage();
    const transformAttachements = useTransformAttachments();

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
    const run = useCallback(async (message: MessageExtended, compute: Computation, action?: string) => {
        const result = (await compute(message, { action, cache, mailSettings })) || {};

        if (result.document) {
            result.content = result.document.innerHTML;
        }

        return { ...message, ...result } as MessageExtended;
    }, []);

    /**
     * Run a list of computation sequentially
     */
    const runSerial = useCallback(
        async (message: MessageExtended, computes: Computation[], action?: string) => {
            return await computes.reduce(async (messagePromise: Promise<MessageExtended>, compute: Computation) => {
                return run(await messagePromise, compute, action);
            }, Promise.resolve(message));
        },
        [run]
    );

    // TODO: Handle cache?
    const initialize = useCallback(
        (message: MessageExtended, action?: string) => {
            return runSerial(message, [load, markAsRead, decrypt, ...transforms], action);
        },
        [runSerial]
    );

    const loadRemoteImages = useCallback(
        (message: MessageExtended, action?: string) => {
            return run({ ...message, showRemoteImages: true }, transformRemote, action);
        },
        [run]
    );

    const loadEmbeddedImages = useCallback(
        (message: MessageExtended, action?: string) => {
            return runSerial(
                { ...message, showEmbeddedImages: true },
                [transformEmbedded, transformAttachements],
                action
            );
        },
        [runSerial]
    );

    return { run, runSerial, initialize, loadRemoteImages, loadEmbeddedImages };
};

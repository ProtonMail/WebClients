import type { Action } from 'redux';
import { type Middleware, isAction } from 'redux';

import { actionStream } from '@proton/pass/store/actions/creators/client';
import type { MaybeNull } from '@proton/pass/types/utils/index';
import { unary } from '@proton/pass/utils/fp/variadics';
import { logger } from '@proton/pass/utils/logger';
import type { Chunk } from '@proton/pass/utils/object/chunk';
import { fromChunks } from '@proton/pass/utils/object/chunk';

type ChunkState = {
    /** Pending actions intercepted during state hydration */
    pending: Action[];
    /** Accumulated chunks for the current hydration sequence */
    chunks: Chunk[];
    /** Timeout ID for the current stream processing */
    timer: MaybeNull<NodeJS.Timeout>;
    /** ID of the current stream being processed */
    streamID: MaybeNull<string>;
};

interface ChunkController {
    /** Whether a hydration process is currently active */
    active: boolean;
    /** Current hydration state */
    state: ChunkState;
    /** Whether to accept a chunk from a stream action. This validates
     * if the incoming chunk belongs to the currently processing stream.
     * Otherwise, rejects it to prevent mixing chunks. */
    acceptChunk: (chunk: Chunk) => boolean;
    /** Buffer an action to be processed after hydration completes.
     * This includes both regular actions and streamed actions that
     * might belong to different streams. Buffered streamed actions
     * will be processed recursively after the current stream completes */
    bufferAction: (action: Action) => void;
    /** Process a new chunk and return whether hydration is complete */
    processChunk: (chunk: Chunk) => boolean;
    /** Reset the controller state */
    reset: () => void;
    /** middleware */
    next: (action: unknown) => unknown;
}

export const createChunkController = (next: (action: unknown) => unknown): ChunkController => {
    const state: ChunkState = {
        pending: [],
        chunks: [],
        timer: null,
        streamID: null,
    };

    const clearTimer = () => {
        if (!state.timer) return;
        clearTimeout(state.timer);
        state.timer = null;
    };

    const controller: ChunkController = {
        get active() {
            return state.chunks.length > 0;
        },

        get state() {
            return state;
        },

        next,

        acceptChunk: (chunk) => {
            /** Handle case when chunks from a different hydration
             * batch arrive. If chunk `streamID` or total doesn't match,
             * we're dealing with a new stream */
            if (state.chunks.length === 0) {
                state.streamID = chunk.streamID;
                return true;
            }

            return state.streamID === chunk.streamID;
        },

        bufferAction: (action) => state.pending.push(action),

        processChunk: (chunk) => {
            const { total } = chunk;
            state.chunks.push(chunk);

            clearTimer();

            state.timer = setTimeout(() => {
                if (state.chunks.length > 0) {
                    logger.warn(`[ChunkMiddleware] Stream ${state.streamID} timed out.`);
                    controller.reset();
                }
            }, 1_500);

            return state.chunks.length === total;
        },

        reset: () => {
            clearTimer();

            const pending = state.pending;

            state.chunks = [];
            state.pending = [];
            state.timer = null;
            state.streamID = null;

            /** When a stream completes, this function is called recursively
             * on all pending actions, ensuring that any buffered stream actions
             * are properly processed with the same chunking logic. */
            pending.forEach(unary(controller.next));
        },
    };

    return controller;
};

export const chunkMiddleware = (): Middleware => {
    return () => (next) => {
        const controller = createChunkController((action: unknown) => {
            if (!isAction(action)) return;

            if (actionStream.match(action) && controller.acceptChunk(action.payload.chunk)) {
                const complete = controller.processChunk(action.payload.chunk);
                if (!complete) return;

                const streamedAction = fromChunks(controller.state.chunks) as Action;

                if (isAction(streamedAction)) {
                    const size = controller.state.chunks.length;
                    logger.info(`[ChunkMiddleware] ${streamedAction.type} in ${size} chunk(s)`);
                    next(streamedAction);
                }

                return controller.reset();
            }

            return (controller.active ? controller.bufferAction : next)(action);
        });

        return controller.next;
    };
};

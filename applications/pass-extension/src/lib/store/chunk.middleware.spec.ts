import type { MiddlewareAPI } from 'redux';

import { actionStream } from '@proton/pass/store/actions';
import type { Chunk } from '@proton/pass/utils/object/chunk';
import * as chunkUtils from '@proton/pass/utils/object/chunk';
import { uniqueId } from '@proton/pass/utils/string/unique-id';

import { chunkMiddleware, createChunkController } from './chunk.middleware';

jest.mock('@proton/pass/utils/object/chunk', () => ({ fromChunks: jest.fn() }));
const fromChunks = chunkUtils.fromChunks as jest.Mock;

const createChunk = (options: { streamID?: string; index: number; total: number }): Chunk => ({
    ...options,
    streamID: options.streamID ?? uniqueId(),
    chunk: 'data',
    size: 10,
});

describe('chunk middleware', () => {
    let next: jest.Mock;
    let middleware: (action: unknown) => unknown;
    let controller: ReturnType<typeof createChunkController>;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        fromChunks.mockReturnValue({ type: 'RECONSTRUCTED_ACTION' });
        next = jest.fn();

        middleware = chunkMiddleware()({} as MiddlewareAPI)(next);
        controller = createChunkController(next);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('createChunkController', () => {
        test('should initialize with empty state', () => {
            expect(controller.active).toBe(false);
            expect(controller.state).toEqual({
                pending: [],
                chunks: [],
                timer: null,
                streamID: null,
            });
        });

        test('should buffer actions', () => {
            controller.bufferAction({ type: 'TEST_ACTION' });
            expect(controller.state.pending).toEqual([{ type: 'TEST_ACTION' }]);
        });

        test('should process chunks correctly', () => {
            const chunk1 = createChunk({ streamID: 'test', index: 0, total: 2 });
            const chunk2 = createChunk({ streamID: 'test', index: 1, total: 2 });

            expect(controller.acceptChunk(chunk1)).toBe(true);
            expect(controller.processChunk(chunk1)).toBe(false);
            expect(controller.active).toBe(true);
            expect(controller.state.streamID).toBe(chunk1.streamID);

            expect(controller.acceptChunk(chunk2)).toBe(true);
            expect(controller.processChunk(chunk2)).toBe(true);
            expect(controller.state.chunks).toEqual([chunk1, chunk2]);
        });

        test('should accept first chunk of any stream when inactive', () => {
            const chunk = createChunk({ index: 0, total: 2 });
            expect(controller.acceptChunk(chunk)).toBe(true);
        });

        test('should only accept chunks from the current stream', () => {
            const chunk1 = createChunk({ streamID: 'test-1', index: 0, total: 2 });
            const chunk2 = createChunk({ streamID: 'test-2', index: 1, total: 2 });

            expect(controller.acceptChunk(chunk1)).toBe(true);
            controller.processChunk(chunk1);

            expect(controller.acceptChunk(chunk2)).toBe(false);
        });

        test('should reset controller state', () => {
            controller.bufferAction({ type: 'TEST_ACTION' });
            controller.processChunk(createChunk({ index: 1, total: 2 }));
            controller.reset();

            expect(controller.state).toEqual({
                pending: [],
                chunks: [],
                timer: null,
                streamID: null,
            });

            expect(controller.active).toBe(false);
            expect(next).toHaveBeenCalledWith({ type: 'TEST_ACTION' });
        });

        test('should set timeout when processing chunk', () => {
            const chunk = createChunk({ index: 1, total: 2 });
            controller.processChunk(chunk);

            expect(controller.state.timer).not.toBeNull();
        });

        test('should clear timeout when resetting', () => {
            const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

            controller.processChunk(createChunk({ index: 1, total: 2 }));
            const timerID = controller.state.timer;
            controller.reset();

            expect(clearTimeoutSpy).toHaveBeenCalledWith(timerID);
            expect(controller.state.timer).toBeNull();
        });

        test('should auto-reset when timer expires', () => {
            const reset = jest.spyOn(controller, 'reset');
            controller.processChunk(createChunk({ index: 1, total: 2 }));

            expect(controller.active).toBe(true);

            jest.advanceTimersByTime(1500);
            expect(reset).toHaveBeenCalled();
            expect(controller.active).toBe(false);
        });
    });

    describe('chunkMiddleware', () => {
        test('should pass through regular actions when not active', () => {
            const action = { type: 'REGULAR_ACTION' };
            middleware(action);

            expect(next).toHaveBeenCalledWith(action);
        });

        test('should buffer actions when processing is active', () => {
            const action = { type: 'REGULAR_ACTION' };
            middleware(actionStream(createChunk({ index: 1, total: 2 })));
            middleware(action);

            expect(next).not.toHaveBeenCalledWith(action);
        });

        test('should process streaming chunks and dispatch reconstructed action', () => {
            const chunk1 = createChunk({ streamID: 'test', index: 0, total: 2 });
            const chunk2 = createChunk({ streamID: 'test', index: 1, total: 2 });

            middleware(actionStream(chunk1));
            expect(next).not.toHaveBeenCalled();

            middleware(actionStream(chunk2));
            expect(fromChunks).toHaveBeenCalledWith([chunk1, chunk2]);
            expect(next).toHaveBeenCalledWith({ type: 'RECONSTRUCTED_ACTION' });
        });

        test('should auto resolve 1 chunk streams', () => {
            const chunk1 = createChunk({ streamID: 'test', index: 0, total: 1 });
            middleware(actionStream(chunk1));

            expect(next).toHaveBeenCalledWith({ type: 'RECONSTRUCTED_ACTION' });
        });

        test('should dispatch pending actions after stream completes', () => {
            const chunk1 = createChunk({ streamID: 'test', index: 0, total: 2 });
            const chunk2 = createChunk({ streamID: 'test', index: 1, total: 2 });
            const action1 = { type: 'PENDING_1' };
            const action2 = { type: 'PENDING_2' };

            middleware(actionStream(chunk1));
            middleware(action1);
            middleware(action2);
            middleware(actionStream(chunk2));

            expect(next).toHaveBeenCalledTimes(3);
            expect(next).toHaveBeenNthCalledWith(1, { type: 'RECONSTRUCTED_ACTION' });
            expect(next).toHaveBeenNthCalledWith(2, action1);
            expect(next).toHaveBeenNthCalledWith(3, action2);
        });

        test('should ignore non-action values', () => {
            middleware(null);
            middleware(undefined);
            middleware('string');
            middleware(123);

            expect(next).not.toHaveBeenCalled();
        });

        test('should handle recursive stream processing', () => {
            const outerChunk1 = createChunk({ streamID: 'outer', index: 0, total: 2 });
            const outerChunk2 = createChunk({ streamID: 'outer', index: 1, total: 2 });
            const innerChunk1 = createChunk({ streamID: 'inner', index: 0, total: 2 });
            const innerChunk2 = createChunk({ streamID: 'inner', index: 1, total: 2 });

            fromChunks.mockReturnValueOnce({ type: 'OUTER_ACTION' }).mockReturnValueOnce({ type: 'INNER_ACTION' });

            middleware(actionStream(outerChunk1));
            middleware(actionStream(innerChunk1));
            middleware(actionStream(outerChunk2));
            middleware(actionStream(innerChunk2));

            expect(next).toHaveBeenCalledTimes(2);
            expect(next).toHaveBeenNthCalledWith(1, { type: 'OUTER_ACTION' });
            expect(next).toHaveBeenNthCalledWith(2, { type: 'INNER_ACTION' });
        });

        test('should timeout and reset if stream is incomplete', () => {
            middleware(actionStream(createChunk({ index: 0, total: 2 })));

            expect(next).not.toHaveBeenCalled();
            jest.advanceTimersByTime(1500);

            const action = { type: 'AFTER_TIMEOUT' };

            middleware(action);
            expect(next).toHaveBeenCalledWith(action);
        });
    });
});

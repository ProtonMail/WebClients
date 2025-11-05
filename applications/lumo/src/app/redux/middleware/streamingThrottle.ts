import type { Middleware } from '@reduxjs/toolkit';
import { appendChunk } from '../slices/core/messages';

/**
 * Streaming Throttle Middleware
 *
 * This middleware batches `appendChunk` actions during streaming to reduce
 * the number of Redux state updates and subsequent re-renders.
 *
 * PROBLEM:
 * - Streaming tokens arrive rapidly (potentially 100+ per second)
 * - Each token triggers appendChunk → Redux update → React re-render
 * - This causes performance issues and UI lag
 *
 * SOLUTION:
 * - Batch multiple appendChunk actions into a single update
 * - Use requestAnimationFrame to sync updates with browser paint cycles
 * - Accumulate chunks in a buffer and flush periodically
 *
 * RESULT:
 * - Reduces Redux updates from 1000+ to ~60 per second (one per frame)
 * - Significantly improves performance during streaming
 * - No loss of data - all chunks are eventually applied
 */

const FLUSH_INTERVAL = 8; // ~120fps (smoother updates, less batching)
const MAX_BUFFER_SIZE = 5; // Force flush after fewer chunks for smoother feel

interface ChunkBuffer {
    messageId: string;
    content: string;
}

class StreamingThrottler {
    private buffers: Map<string, ChunkBuffer> = new Map();
    private flushInterval: NodeJS.Timeout | null = null;
    private dispatchFn: ((chunks: ChunkBuffer[]) => void) | null = null;
    private isStreaming: boolean = false;

    /**
     * Set the dispatch function that will be called on flush
     */
    setDispatchFn(fn: (chunks: ChunkBuffer[]) => void) {
        this.dispatchFn = fn;
    }

    /**
     * Add a chunk to the buffer
     */
    addChunk(messageId: string, content: string) {
        const existing = this.buffers.get(messageId);

        if (existing) {
            existing.content += content;
        } else {
            this.buffers.set(messageId, { messageId, content });
        }

        // Start interval-based flushing if not already running
        if (!this.isStreaming) {
            this.startStreaming();
        }

        // Force flush if buffer is getting large
        if (existing && existing.content.length > MAX_BUFFER_SIZE * 100) {
            this.flushNow();
        }
    }

    /**
     * Start continuous flushing at fixed intervals
     */
    private startStreaming() {
        if (this.flushInterval !== null) return;

        this.isStreaming = true;
        this.flushInterval = setInterval(() => {
            this.flushNow();
        }, FLUSH_INTERVAL);
    }

    /**
     * Stop continuous flushing
     */
    private stopStreaming() {
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
            this.flushInterval = null;
        }
        this.isStreaming = false;
    }

    /**
     * Flush all buffered chunks immediately
     */
    private flushNow() {
        if (this.buffers.size === 0) {
            // No data for a while, stop the interval
            if (this.isStreaming) {
                this.stopStreaming();
            }
            return;
        }

        const chunks = Array.from(this.buffers.values());
        this.buffers.clear();

        // Dispatch the batched chunks
        if (this.dispatchFn) {
            this.dispatchFn(chunks);
        }
    }

    /**
     * Flush all buffered chunks (for external use)
     */
    flush(): ChunkBuffer[] {
        const chunks = Array.from(this.buffers.values());
        this.buffers.clear();
        this.stopStreaming();
        return chunks;
    }

    /**
     * Clear all buffers
     */
    clear() {
        this.stopStreaming();
        this.buffers.clear();
    }
}

const throttler = new StreamingThrottler();

/**
 * Middleware that throttles appendChunk actions
 */
export const streamingThrottleMiddleware: Middleware = (store) => (next) => {
    // Set up the dispatch function for batched updates
    throttler.setDispatchFn((chunks) => {
        chunks.forEach((chunk) => {
            next({
                type: appendChunk.type,
                payload: chunk,
            });
        });
    });

    return (action: any) => {
        // If finishMessage arrives, flush any pending chunks FIRST
        if (action.type === 'lumo/message/finish') {
            const pendingChunks = throttler.flush();
            pendingChunks.forEach((chunk) => {
                next({
                    type: appendChunk.type,
                    payload: chunk,
                });
            });
            // Now process finishMessage
            return next(action);
        }

        // Only intercept appendChunk actions
        if (action.type !== appendChunk.type) {
            return next(action);
        }

        const { messageId, content } = action.payload;

        // Add to buffer - timer will handle flushing at 60fps
        throttler.addChunk(messageId, content);

        // Don't pass through immediately - prevents Redux spam
        return action;
    };
};

/**
 * Force flush any remaining chunks (useful when streaming completes)
 */
export const flushStreamingChunks = () => {
    return throttler.flush();
};

/**
 * Clear all buffers (useful for cleanup)
 */
export const clearStreamingBuffers = () => {
    throttler.clear();
};

export default streamingThrottleMiddleware;


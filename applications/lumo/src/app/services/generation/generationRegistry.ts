import type { ConversationId } from '../../types';

export const OPERATION_IN_PROGRESS_MESSAGE = 'Another operation is already in progress';

/**
 * App-level registry of in-flight generation AbortControllers, keyed by conversation id.
 *
 * Generation itself runs inside Redux thunks (see `sendMessageWithRedux`), which are detached
 * from the React component tree and keep running after a component unmounts. Previously the only
 * thing tying a generation to a mounted page was the per-component `AbortController`, which was
 * aborted on unmount — so navigating away cancelled the in-flight response.
 *
 * By owning the controllers here (module singleton) instead of in a component hook, generation
 * survives navigation and is only cancelled on an *explicit* user stop (or a deliberate teardown
 * such as logout via `abortAll`). The per-conversation key also allows multiple conversations to
 * generate concurrently.
 */
class GenerationRegistry {
    private controllers = new Map<ConversationId, AbortController>();
    private listeners = new Set<() => void>();

    /** Calls `listener` whenever a conversation starts or stops generating. Returns the unsubscribe. */
    subscribe = (listener: () => void): (() => void) => {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    };

    private notify(): void {
        this.listeners.forEach((listener) => listener());
    }

    /**
     * Register and return a fresh AbortController for the given conversation.
     * Throws if a generation is already in progress for that conversation.
     */
    start(conversationId: ConversationId): AbortController {
        if (this.controllers.has(conversationId)) {
            throw new Error(OPERATION_IN_PROGRESS_MESSAGE);
        }
        const controller = new AbortController();
        this.controllers.set(conversationId, controller);
        this.notify();
        return controller;
    }

    /** Remove the controller for a conversation once its generation settles. */
    finish(conversationId: ConversationId): void {
        if (this.controllers.delete(conversationId)) {
            this.notify();
        }
    }

    /** Abort the in-flight generation for a conversation (explicit user stop). */
    abort(conversationId: ConversationId): void {
        const controller = this.controllers.get(conversationId);
        if (controller) {
            controller.abort();
            this.controllers.delete(conversationId);
            this.notify();
        }
    }

    /** Abort every in-flight generation (e.g. on logout / app teardown). */
    abortAll(): void {
        for (const controller of this.controllers.values()) {
            controller.abort();
        }
        this.controllers.clear();
        this.notify();
    }

    isInProgress(conversationId: ConversationId): boolean {
        return this.controllers.has(conversationId);
    }
}

export const generationRegistry = new GenerationRegistry();

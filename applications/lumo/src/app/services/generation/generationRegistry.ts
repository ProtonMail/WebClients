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
export class GenerationRegistry {
    private controllers = new Map<ConversationId, AbortController>();
    private listeners = new Set<() => void>();
    private ownership = new Map<ConversationId, { controller: AbortController; release: () => void }>();

    canRecover(): boolean {
        return navigator.locks !== undefined;
    }

    async startExclusive(conversationId: ConversationId): Promise<AbortController> {
        const controller = this.start(conversationId);
        if (navigator.locks === undefined) {
            return controller;
        }
        const acquired = Promise.withResolvers<void>();
        const released = Promise.withResolvers<void>();
        try {
            void navigator.locks
                .request(`lumo-generation:${conversationId}`, { ifAvailable: true }, async (lock) => {
                    if (lock === null) {
                        acquired.reject(new Error(OPERATION_IN_PROGRESS_MESSAGE));
                        return;
                    }
                    if (controller.signal.aborted || this.controllers.get(conversationId) !== controller) {
                        acquired.reject(new DOMException('Generation stopped', 'AbortError'));
                        return;
                    }
                    this.ownership.set(conversationId, { controller, release: released.resolve });
                    acquired.resolve();
                    await released.promise;
                })
                .catch(acquired.reject);
            await acquired.promise;
            return controller;
        } catch (error) {
            this.finish(conversationId, controller);
            throw error;
        }
    }

    subscribe = (listener: () => void): (() => void) => {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    };

    private notifyListeners(): void {
        this.listeners.forEach((listener) => listener());
    }

    /**
     * Register and return a fresh AbortController for the given conversation.
     * Throws if a generation is already in progress for that conversation.
     */
    start(conversationId: ConversationId): AbortController {
        if (this.controllers.has(conversationId) || this.ownership.has(conversationId)) {
            throw new Error(OPERATION_IN_PROGRESS_MESSAGE);
        }
        const controller = new AbortController();
        this.controllers.set(conversationId, controller);
        this.notifyListeners();
        return controller;
    }

    /** Remove the controller for a conversation once its generation settles. */
    finish(conversationId: ConversationId, controller?: AbortController): void {
        const ownership = this.ownership.get(conversationId);
        if (controller === undefined || ownership?.controller === controller) {
            ownership?.release();
            this.ownership.delete(conversationId);
        }
        if (controller === undefined || this.controllers.get(conversationId) === controller) {
            this.controllers.delete(conversationId);
        }
        this.notifyListeners();
    }

    /** Keep aborted generations registered until finishing, so recovery cannot restart them. */
    abort(conversationId: ConversationId): void {
        const controller = this.controllers.get(conversationId);
        if (controller) {
            controller.abort();
        }
    }

    /** Abort every in-flight generation (e.g. on logout / app teardown). */
    abortAll(): void {
        for (const controller of this.controllers.values()) {
            controller.abort();
        }
        this.controllers.clear();
        this.notifyListeners();
    }

    isInProgress(conversationId: ConversationId): boolean {
        return this.controllers.has(conversationId);
    }
}

export const generationRegistry = new GenerationRegistry();

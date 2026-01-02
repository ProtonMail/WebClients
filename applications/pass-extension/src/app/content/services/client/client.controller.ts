/* eslint-disable lodash/import-scope */
/** Content script lifecycle orchestrator that manages client instances based on frame visibility.
 * Creates clients when frames become visible and destroys them when hidden to optimize resource
 * usage. Handles browser BFCache restoration and supports clean unloading during extension updates.
 * Sub-frames may defer client initialization until the page observer detects activity, avoiding
 * unnecessary resource allocation in irrelevant frames. Main frames start immediately when visible.
 * Includes activity probing for service worker connection health on long-running tabs. */
import type { DebouncedFunc } from 'lodash';
import debounce from 'lodash/debounce';
import { withContext } from 'proton-pass-extension/app/content/context/context';
import type {
    ContentScriptClient,
    ContentScriptClientFactoryOptions,
} from 'proton-pass-extension/app/content/services/client/client';
import type {
    FrameMessageBroker,
    FrameMessageHandler,
} from 'proton-pass-extension/app/content/services/client/client.channel';
import { createFrameMessageBroker } from 'proton-pass-extension/app/content/services/client/client.channel';
import type { ClientObserverEvent } from 'proton-pass-extension/app/content/services/client/client.observer';
import {
    type ClientObserver,
    createClientObserver,
} from 'proton-pass-extension/app/content/services/client/client.observer';
import { registerCustomElements } from 'proton-pass-extension/app/content/services/inline/custom-elements/register';
import {
    assertFrameVisible,
    getFrameAttributes,
    getFrameElement,
    getFrameVisibility,
    isSandboxedFrame,
} from 'proton-pass-extension/app/content/utils/frame';
import { contentScriptMessage, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import 'proton-pass-extension/lib/polyfills/shim';
import { getNodePosition } from 'proton-pass-extension/lib/utils/dom';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import type { PassElementsConfig } from '@proton/pass/types/utils/dom';
import type { Maybe, MaybeNull } from '@proton/pass/types/utils/index';
import { asyncLock } from '@proton/pass/utils/fp/promises';
import { safeAsyncCall } from '@proton/pass/utils/fp/safe-call';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import { logger, registerLoggerEffect } from '@proton/pass/utils/logger';
import { createActivityProbe } from '@proton/pass/utils/time/probe';

export interface ClientController {
    /** Destroys controller and cleans up all resources. Safe to call at any
     * lifecycle stage. Passed to `ExtensionContext` for handling SW termination
     * cases where unload events fail. */
    destroy: (err?: unknown) => void;
    init: () => Promise<void>;
    defer: () => void;
    start: DebouncedFunc<() => Promise<void>>;
    startImmediate: () => void;
    stop: (reason: string) => void;
    registerElements: () => Promise<PassElementsConfig>;

    channel: FrameMessageBroker;
    deferred: boolean;
    deferredUnsubscribe: Maybe<() => void>;
    elements: MaybeNull<PassElementsConfig>;
    instance: MaybeNull<ContentScriptClient>;
    observer: ClientObserver;
}

type ClientControllerOptions = Omit<ContentScriptClientFactoryOptions, 'controller' | 'elements'> & {
    clientFactory: (options: ContentScriptClientFactoryOptions) => ContentScriptClient;
};

export const CLIENT_START_TIMEOUT_MS = 350;
export const CLIENT_ACTIVITY_PROBE_MS = 25_000;
const ping = () => sendMessage(contentScriptMessage({ type: WorkerMessageType.PING }));

/** Validates frame visibility to prevent autofill in hidden iframes and ensure
 * UI overlays only appear on visible frames. Rejects if any parent frame is hidden. */
const onFrameQuery: FrameMessageHandler<WorkerMessageType.FRAME_QUERY> = withContext(
    (ctx, { payload }, sendResponse) => {
        const target = getFrameElement(payload.frameId, payload.frameAttributes);
        if (!target) sendResponse({ ok: false });
        else if (isSandboxedFrame(target)) sendResponse({ ok: false });
        else {
            switch (payload.type) {
                case 'form':
                    const forms = ctx?.service.formManager.getForms();
                    const form = forms?.find((form) => form.element.contains(target));
                    sendResponse({ ok: true, type: 'form', formId: form?.formId ?? null });
                    break;

                case 'position':
                    if (!getFrameVisibility(target)) sendResponse({ ok: false });
                    else {
                        sendResponse({
                            ok: true,
                            type: 'position',
                            /** Report frame position relative to current
                             * document (may be nested iframe) */
                            coords: getNodePosition(target),
                            /** Return frame attributes to enable continued
                             * tree-walking in parent frames  */
                            frameAttributes: getFrameAttributes(),
                        });
                    }
                    break;
            }
        }

        return true;
    }
);

export const createClientController = ({
    clientFactory,
    scriptId,
    mainFrame,
}: ClientControllerOptions): ClientController => {
    const probe = mainFrame ? createActivityProbe() : null;
    const listeners = createListenerStore();
    const observer = createClientObserver(mainFrame);
    const transport = createFrameMessageBroker();

    const controller: ClientController = {
        instance: null as MaybeNull<ContentScriptClient>,
        channel: transport,
        observer,
        deferred: false,
        deferredUnsubscribe: undefined,
        elements: null,

        registerElements: asyncLock(async () => {
            if (controller.elements) return controller.elements;
            return (controller.elements = await registerCustomElements());
        }),

        /** Sub-frames: defer until observer detects activity to avoid loading the client
         * in irrelevant frames. This optimization prevents resource allocation in frames
         * that may never become interactive (e.g., tracking pixels, analytics iframes).
         *
         * 1. Set up DOM mutation observer immediately
         * 2. Wait for meaningful activity (DOM mutations or resize events)
         * 3. Validate frame visibility before actually starting the client
         * 4. Start client only if frame becomes active and visible */
        defer: () => {
            logger.debug(`[ClientController::${scriptId}] Deferring sub-frame initialization`);
            observer.observe();
            controller.deferred = true;

            const isDeferredStartTrigger = async (evt: ClientObserverEvent): Promise<boolean> => {
                /** DOM mutations are considered valid triggers as they indicate the frame
                 * is actively being modified, suggesting it's not a static/tracking frame */
                if (evt.type === 'mutation') return true;
                /** Resize events require additional visibility validation since they can
                 * fire for hidden frames during layout changes. We verify the frame is
                 * actually visible before considering it a valid trigger. */
                if (evt.type === 'event' && evt.event.type === 'resize') return assertFrameVisible(mainFrame);

                return false;
            };

            const unsubscribe = observer.subscribe(async (evt) => {
                if (controller.instance) return controller.deferredUnsubscribe?.();
                if (await isDeferredStartTrigger(evt)) void controller.start();
            });

            controller.deferredUnsubscribe = () => {
                unsubscribe();
                delete controller.deferredUnsubscribe;
            };
        },

        init: async () => {
            const onContentScriptUnload = () => controller.destroy('unload');

            /** Handles deferred initialization messages from sibling frame: when
             * a deferred sub-frame starts up, it may indicate that sibling frames
             * should also be re-evaluated for initialization. This prevents scenarios
             * where forms spanning multiple frames are only partially detected because
             * some sibling frames remain deferred. */
            const onFrameDeferredInit = () => {
                getFrameVisibility.clear();
                if (controller.instance || !controller.deferred) return;
                void assertFrameVisible(mainFrame).then((visible) => visible && controller.startImmediate());
            };

            controller.channel.register(WorkerMessageType.UNLOAD_CONTENT_SCRIPT, onContentScriptUnload);
            controller.channel.register(WorkerMessageType.FRAME_QUERY, onFrameQuery);
            controller.channel.register(WorkerMessageType.FRAME_DEFERRED_INIT, onFrameDeferredInit);

            registerLoggerEffect((...logs) =>
                sendMessage(
                    contentScriptMessage({
                        type: WorkerMessageType.LOG_EVENT,
                        payload: { log: logs.join(' ') },
                    })
                )
            );

            let abortCtrl = new AbortController();

            const startWhenVisible = safeAsyncCall(async (options: { immediate: boolean }, signal: AbortSignal) => {
                const visible = await assertFrameVisible(mainFrame);

                if (!signal.aborted) {
                    if (visible) void controller[options.immediate ? 'startImmediate' : 'start']();
                    else {
                        if (mainFrame) controller.stop('frame-hidden');
                        else controller.defer();
                    }
                }
            });

            listeners.addListener(document, 'visibilitychange', () => {
                switch (document.visibilityState) {
                    case 'visible':
                        abortCtrl = new AbortController();
                        return startWhenVisible({ immediate: false }, abortCtrl.signal);
                    case 'hidden':
                        abortCtrl.abort();
                        return controller.stop('hidden');
                }
            });

            /** If visible on first initialization: start immediately */
            await startWhenVisible({ immediate: true }, abortCtrl.signal);
        },

        /** Debounced with trailing-only execution to coalesce rapid tab switches.
         * The 350ms delay with trailing: true ensures final visibility state is
         * captured while preventing thrashing during quick changes in Safari. */
        start: debounce(
            async () => {
                observer.observe();
                controller.deferredUnsubscribe?.();

                if (!controller.instance) {
                    try {
                        if (!mainFrame && controller.deferred) {
                            /** NOTE: child/sibling frames of this sub-frame may have been deferred as
                             * well due to their parent having been deferred. Forward this event
                             * to children which may now be considered "active". */
                            void sendMessage(contentScriptMessage({ type: WorkerMessageType.FRAME_DEFERRED_INIT }));
                            logger.debug(`[ClientController::${scriptId}] Starting sub-frame client`);
                            controller.deferred = false;
                        }

                        const elements = await controller.registerElements();
                        controller.instance = clientFactory({ scriptId, elements, mainFrame, controller });
                        controller.instance.start();
                        probe?.start(ping, CLIENT_ACTIVITY_PROBE_MS);
                    } catch {
                        controller.destroy();
                    }
                }
            },
            CLIENT_START_TIMEOUT_MS,
            { leading: false, trailing: true }
        ),

        startImmediate: () => {
            if (!controller.instance) {
                void controller.start();
                void controller.start.flush();
            }
        },

        stop: (reason: string) => {
            probe?.cancel();
            controller.start.cancel();
            controller.observer.destroy();
            controller.deferredUnsubscribe?.();
            controller.instance?.destroy({ reason });
            controller.deferred = false;
            controller.instance = null;
        },

        /** Stops the client and removes all listeners. Once called
         * called, the current controller can no longer be re-used. */
        destroy: (err?: unknown) => {
            const reason = err instanceof Error ? err.message : err;
            listeners.removeAll();
            controller.stop(String(reason ?? 'destroyed'));
            controller.channel.destroy();
            controller.elements = null;
        },
    };

    return controller;
};

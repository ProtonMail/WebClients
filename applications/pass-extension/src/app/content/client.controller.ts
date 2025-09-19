/* eslint-disable lodash/import-scope */
/** Content script lifecycle orchestrator that manages client instances based on frame visibility.
 * Creates clients when frames become visible and destroys them when hidden to optimize resource
 * usage. Handles browser BFCache restoration and supports clean unloading during extension updates.
 * Sub-frames may defer client initialization until the page observer detects activity, avoiding
 * unnecessary resource allocation in irrelevant frames. Main frames start immediately when visible.
 * Includes activity probing for service worker connection health on long-running tabs. */
import type { DebouncedFunc } from 'lodash';
import type {
    ContentScriptClient,
    ContentScriptClientFactoryOptions,
} from 'proton-pass-extension/app/content/services/client';
import {
    getFrameAttributes,
    getFrameElement,
    getFrameParentVisibility,
    getFrameVisibility,
    isNegligableFrameRect,
} from 'proton-pass-extension/app/content/utils/frame';
import type {
    FrameMessageBroker,
    FrameMessageHandler,
} from 'proton-pass-extension/app/content/utils/frame.message-broker';
import { createFrameMessageBroker } from 'proton-pass-extension/app/content/utils/frame.message-broker';
import { type PageObserver, createPageObserver } from 'proton-pass-extension/app/content/utils/page-observer';
import { contentScriptMessage, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import { getNodePosition } from 'proton-pass-extension/lib/utils/dom';
import 'proton-pass-extension/lib/utils/polyfills';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import type { MaybeNull } from '@proton/pass/types';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import { logger, registerLoggerEffect } from '@proton/pass/utils/logger';
import { createActivityProbe } from '@proton/pass/utils/time/probe';
import debounce from '@proton/utils/debounce';
import noop from '@proton/utils/noop';

export interface ClientController {
    /** Destroys controller and cleans up all resources. Safe to call at any lifecycle stage.
     * Passed to `ExtensionContext` for handling SW termination cases where unload events fail. */
    destroy: (err?: unknown) => void;
    init: () => Promise<void>;
    start: DebouncedFunc<() => Promise<void>>;
    stop: (reason: string) => void;

    deferred: boolean;
    instance: MaybeNull<ContentScriptClient>;
    observer: PageObserver;
    channel: FrameMessageBroker;
}

type ClientControllerOptions = Omit<ContentScriptClientFactoryOptions, 'controller'> & {
    clientFactory: (options: ContentScriptClientFactoryOptions) => ContentScriptClient;
};

const ACTIVITY_PROBE_MS = 25_000;
const sendActivityProbe = () => sendMessage(contentScriptMessage({ type: WorkerMessageType.PING }));

/** Validates frame visibility to prevent autofill in hidden iframes and ensure
 * UI overlays only appear on visible frames. Rejects if any parent frame is hidden. */
const onFrameQuery: FrameMessageHandler<WorkerMessageType.FRAME_QUERY> = ({ payload }, _, sendResponse) => {
    const target = getFrameElement(payload.frameId, payload.attributes);
    if (!target) sendResponse({ ok: false });
    else if (!getFrameVisibility(target)) sendResponse({ ok: false });
    else {
        sendResponse({
            ok: true,
            /** Report frame position relative to current
             * document (may be nested iframe) */
            coords: getNodePosition(target),
            /** Return frame attributes to enable continued
             * tree-walking in parent frames  */
            frameAttributes: getFrameAttributes(),
        });
    }

    return true;
};

/** Multi-layer visibility validation to avoid unnecessary work in hidden contexts.
 * Main frames only check document visibility; sub-frames validate size and parent visibility. */
const assertFrameVisible = async (mainFrame: boolean) => {
    if (document.visibilityState !== 'visible') return false;
    if (mainFrame) return true;

    const { childElementCount, clientHeight, clientWidth } = document.documentElement;
    if (childElementCount === 0) return false; /** Empty frame */
    if (isNegligableFrameRect(clientWidth, clientHeight)) return false;
    return getFrameParentVisibility();
};

export const createClientController = ({
    clientFactory,
    elements,
    scriptId,
    mainFrame,
}: ClientControllerOptions): ClientController => {
    const probe = createActivityProbe();
    const listeners = createListenerStore();
    const observer = createPageObserver();
    const transport = createFrameMessageBroker();

    const controller: ClientController = {
        instance: null as MaybeNull<ContentScriptClient>,
        channel: transport,
        observer,
        deferred: false,

        init: async () => {
            controller.channel.register(WorkerMessageType.UNLOAD_CONTENT_SCRIPT, () => controller.destroy('unload'));
            controller.channel.register(WorkerMessageType.FRAME_QUERY, onFrameQuery);

            registerLoggerEffect((...logs) =>
                sendMessage(
                    contentScriptMessage({
                        type: WorkerMessageType.LOG_EVENT,
                        payload: { log: logs.join(' ') },
                    })
                )
            );

            const visible = await assertFrameVisible(mainFrame);

            listeners.addListener(document, 'visibilitychange', () => {
                switch (document.visibilityState) {
                    case 'visible':
                        if (controller.deferred) observer.observe();
                        return assertFrameVisible(mainFrame)
                            .then((visible) => {
                                if (visible) return controller.start();
                                else controller.stop('frame-hidden');
                            })
                            .catch(noop);
                    case 'hidden':
                        return controller.stop('hidden');
                }
            });

            const startImmediate = () => {
                controller.start()?.catch(controller.destroy);
                controller.start.flush()?.catch(controller.destroy);
            };

            if (visible) return startImmediate();
            else if (!mainFrame) {
                /** Sub-frames: defer until observer detects activity
                 * to avoid loading the client in irrelevant frames. */
                observer.observe();
                controller.deferred = true;

                logger.debug(`[ClientController::${scriptId}] Deferring sub-frame initialization`);

                observer.subscribe(
                    (reason) => {
                        if (!controller.instance) {
                            logger.debug(`[ClientController::${scriptId}] Starting sub-frame client (${reason})`);
                            startImmediate();
                        }
                    },
                    { once: true }
                );
            }
        },

        /** Debounced with trailing-only execution to coalesce rapid tab switches.
         * The 350ms delay with trailing: true ensures final visibility state is
         * captured while preventing thrashing during quick changes in Safari. */
        start: debounce(
            async () => {
                if (!controller.instance) {
                    controller.deferred = false;
                    controller.instance = clientFactory({ scriptId, elements, mainFrame, controller });
                    probe.start(sendActivityProbe, ACTIVITY_PROBE_MS);
                    observer.observe();
                    return controller.instance.start();
                }
            },
            350,
            { leading: false, trailing: true }
        ),

        stop: (reason: string) => {
            probe.cancel();
            controller.start.cancel();
            controller.observer.destroy();
            controller.instance?.destroy({ reason });
            controller.instance = null;
        },

        /** Stops the client and removes all listeners. Once called
         * called, the current controller can no longer be re-used. */
        destroy: (err?: unknown) => {
            const reason = err instanceof Error ? err.message : err;

            listeners.removeAll();
            controller.stop(String(reason ?? 'destroyed'));
            controller.channel.destroy();
            controller.observer.destroy();
        },
    };

    return controller;
};

/* eslint-disable lodash/import-scope */
/** Content script lifecycle orchestrator that manages client instances based on frame visibility.
 * Creates clients when frames become visible and destroys them when hidden to optimize resource
 * usage. Handles browser BFCache restoration and supports clean unloading during extension updates.
 * Sub-frames may defer client initialization until the page observer detects activity, avoiding
 * unnecessary resource allocation in irrelevant frames. Main frames start immediately when visible.
 * Includes activity probing for service worker connection health on long-running tabs. */
import type { DebouncedFunc } from 'lodash';
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
import {
    type ClientObserver,
    createClientObserver,
} from 'proton-pass-extension/app/content/services/client/client.observer';
import {
    getFrameAttributes,
    getFrameElement,
    getFrameParentVisibility,
    getFrameVisibility,
    isNegligableFrameRect,
    isSandboxedFrame,
} from 'proton-pass-extension/app/content/utils/frame';
import { contentScriptMessage, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import 'proton-pass-extension/lib/polyfills/shim';
import { getNodePosition } from 'proton-pass-extension/lib/utils/dom';
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
    observer: ClientObserver;
    channel: FrameMessageBroker;
}

type ClientControllerOptions = Omit<ContentScriptClientFactoryOptions, 'controller'> & {
    clientFactory: (options: ContentScriptClientFactoryOptions) => ContentScriptClient;
};

const ACTIVITY_PROBE_MS = 25_000;
const sendActivityProbe = () => sendMessage(contentScriptMessage({ type: WorkerMessageType.PING }));

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
    const observer = createClientObserver(mainFrame);
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

                const unsub = observer.subscribe(async (evt) => {
                    if (controller.instance) return unsub();

                    const shouldStart = await (async () => {
                        if (evt.type === 'mutation') return true;
                        if (evt.type === 'event' && evt.event.type === 'resize') return assertFrameVisible(mainFrame);
                    })();

                    if (shouldStart && !controller.instance) {
                        logger.debug(`[ClientController::${scriptId}] Starting sub-frame client`);
                        startImmediate();
                        unsub();
                    }
                });
            }
        },

        /** Debounced with trailing-only execution to coalesce rapid tab switches.
         * The 350ms delay with trailing: true ensures final visibility state is
         * captured while preventing thrashing during quick changes in Safari. */
        start: debounce(
            async () => {
                observer.observe();

                if (!controller.instance) {
                    controller.deferred = false;
                    controller.instance = clientFactory({ scriptId, elements, mainFrame, controller });
                    probe.start(sendActivityProbe, ACTIVITY_PROBE_MS);
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

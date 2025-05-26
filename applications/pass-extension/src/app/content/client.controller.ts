/** Main entry point for the client content-script lifecycle orchestration. Creates a unique
 * client ID to manage a `ContentScriptClientService` instance that is dynamically loaded and
 * unloaded based on tab visibility. The client internally manages cleanup of any in-progress
 * operations during destruction, making it safe to destroy at any point in its lifecycle.
 *
 * The content-script client is created when a tab becomes visible and destroyed when hidden.
 * This cycle properly handles browser back-forward cache (BFCache) tab restoration and supports
 * clean unloading via the browser tab API during extension updates or dev-mode hot-reloading.
 *
 * Performance is optimized by freeing resources in inactive tabs through complete client
 * destruction on tab hiding. A continuous activity probe ensures connection health with the
 * service worker through periodic pings for long-running tabs. */
// eslint-disable-next-line lodash/import-scope
import type { DebouncedFunc } from 'lodash';
import type { ContentScriptClient } from 'proton-pass-extension/app/content/services/client';
import type { FrameMessageBroker } from 'proton-pass-extension/app/content/utils/frame.message-broker';
import { createFrameMessageBroker } from 'proton-pass-extension/app/content/utils/frame.message-broker';
import { contentScriptMessage, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import 'proton-pass-extension/lib/utils/polyfills';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import type { MaybeNull } from '@proton/pass/types';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import { registerLoggerEffect } from '@proton/pass/utils/logger';
import { createActivityProbe } from '@proton/pass/utils/time/probe';
import debounce from '@proton/utils/debounce';

export interface ClientController {
    /** Called when content script fails to start or recycle. Passed
     * to the `ExtensionContext` to handle invalidation cases where
     * unload events can't be caught, like during SW termination */
    destroy: (err?: unknown) => void;
    init: () => void;
    stop: (reason: string) => void;

    instance: MaybeNull<ContentScriptClient>;
    start: DebouncedFunc<() => Promise<void>>;
    transport: FrameMessageBroker;
}

type ClientControllerOptions = {
    clientFactory: (controller: ClientController) => ContentScriptClient;
};

const sendActivityProbe = () => sendMessage(contentScriptMessage({ type: WorkerMessageType.PING }));
const ACTIVITY_PROBE_MS = 25_000;

export const createClientController = (options: ClientControllerOptions): ClientController => {
    const probe = createActivityProbe();
    const listeners = createListenerStore();

    const controller: ClientController = {
        instance: null as MaybeNull<ContentScriptClient>,
        transport: createFrameMessageBroker(),

        init: () => {
            registerLoggerEffect((...logs) =>
                sendMessage(
                    contentScriptMessage({
                        type: WorkerMessageType.LOG_EVENT,
                        payload: { log: logs.join(' ') },
                    })
                )
            );

            listeners.addListener(document, 'visibilitychange', () => {
                switch (document.visibilityState) {
                    case 'visible':
                        return controller.start();
                    case 'hidden':
                        return controller.stop('hidden');
                }
            });

            controller.transport.register(WorkerMessageType.UNLOAD_CONTENT_SCRIPT, () => controller.destroy('unload'));

            if (document.visibilityState === 'visible') {
                /* Start client immediately for active pages by calling and
                 * flushing the debounced function with error handling. */
                controller.start()?.catch(controller.destroy);
                controller.start.flush()?.catch(controller.destroy);
            }
        },

        /** Debounced with trailing-only execution to coalesce rapid tab switches.
         * The 350ms delay with trailing: true ensures final visibility state is
         * captured while preventing thrashing during quick changes in Safari. */
        start: debounce(
            async () => {
                if (!controller.instance) {
                    controller.instance = options.clientFactory(controller);
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
            controller.instance?.destroy({ reason });
            controller.instance = null;
        },

        /** Stops the client and removes all listeners. Once called
         * called, the current controller can no longer be re-used. */
        destroy: (err?: unknown) => {
            const reason = err instanceof Error ? err.message : err;

            listeners.removeAll();
            controller.stop(String(reason ?? 'destroyed'));
            controller.transport.destroy();
        },
    };

    return controller;
};

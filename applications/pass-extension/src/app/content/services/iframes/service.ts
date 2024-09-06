import { PASS_ROOT_REMOVED_EVENT } from 'proton-pass-extension/app/content/constants.static';
import { withContext } from 'proton-pass-extension/app/content/context/context';
import type { ProtonPassRoot } from 'proton-pass-extension/app/content/injections/custom-elements/ProtonPassRoot';
import { createIframeRoot } from 'proton-pass-extension/app/content/injections/iframe/create-iframe-root';
import type { IFrameAppService, InjectedDropdown, InjectedNotification } from 'proton-pass-extension/app/content/types';

import type { MaybeNull } from '@proton/pass/types';
import type { PassElementsConfig } from '@proton/pass/types/utils/dom';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import { logger } from '@proton/pass/utils/logger';

import { createDropdown } from './dropdown';
import { createNotification } from './notification';

type IFrameServiceState = {
    apps: { dropdown: MaybeNull<InjectedDropdown>; notification: MaybeNull<InjectedNotification> };
    root: MaybeNull<ProtonPassRoot>;
};
export interface IFrameService {
    dropdown: MaybeNull<InjectedDropdown>;
    notification: MaybeNull<InjectedNotification>;
    root: ProtonPassRoot;
    attachDropdown: () => MaybeNull<InjectedDropdown>;
    attachNotification: () => MaybeNull<InjectedNotification>;
    destroy: () => void;
    init: () => ProtonPassRoot;
}

export const createIFrameService = (elements: PassElementsConfig) => {
    const listeners = createListenerStore();

    const state: IFrameServiceState = {
        apps: { dropdown: null, notification: null },
        root: null,
    };

    /* only re-init the iframe sub-apps if the extension context port has changed */
    const onAttached: <T extends IFrameAppService<any>>(app: T) => void = withContext((ctx, app) => {
        const port = ctx?.getExtensionContext().port;

        if (port && app.getState().port !== port) {
            app.init(port, {
                features: ctx.getFeatureFlags(),
                settings: ctx.getSettings(),
                workerState: ctx.getState(),
            });
        }
    });

    const service: IFrameService = {
        get dropdown() {
            return state.apps.dropdown;
        },

        get notification() {
            return state.apps.notification;
        },

        get root() {
            return state.root ?? service.init();
        },

        init: () => {
            if (state.root) return state.root;

            state.root = createIframeRoot(elements.root);
            if (state.apps.dropdown) onAttached(state.apps.dropdown);
            if (state.apps.notification) onAttached(state.apps.notification);

            const handleRootRemoval = withContext((ctx) => {
                state.root = null;
                state.apps.dropdown?.destroy();
                state.apps.notification?.destroy();
                state.apps.dropdown = null;
                state.apps.notification = null;

                if (!ctx?.getState().stale) service.init();
                else service.destroy();
            });

            listeners.addListener(state.root, PASS_ROOT_REMOVED_EVENT as any, handleRootRemoval, { once: true });
            return state.root;
        },

        destroy: () => {
            listeners.removeAll();
            state.apps.dropdown?.destroy();
            state.apps.notification?.destroy();
            state.root = null; /* reset in-case we recycle the content-script */
        },

        attachDropdown: withContext((ctx) => {
            if (!ctx) return null;

            if (state.apps.dropdown === null) {
                logger.info(`[ContentScript::${ctx.scriptId}] attaching dropdown iframe`);
                state.apps.dropdown = createDropdown({
                    root: service.root,
                    onDestroy: () => (state.apps.dropdown = null),
                });

                onAttached(state.apps.dropdown);
            }

            return state.apps.dropdown;
        }),

        attachNotification: withContext((ctx) => {
            if (!ctx) return null;

            if (state.apps.notification === null) {
                logger.info(`[ContentScript::${ctx.scriptId}] attaching notification iframe`);
                state.apps.notification = createNotification({
                    root: service.root,
                    onDestroy: () => (state.apps.notification = null),
                });

                onAttached(state.apps.notification);
            }

            return state.apps.notification;
        }),
    };

    return service;
};

import { PASS_ROOT_REMOVED_EVENT } from 'proton-pass-extension/app/content/constants.static';
import { withContext } from 'proton-pass-extension/app/content/context/context';
import { PASS_ELEMENT_THEME } from 'proton-pass-extension/app/content/injections/custom-elements/ProtonPassElement';
import type { ProtonPassRoot } from 'proton-pass-extension/app/content/injections/custom-elements/ProtonPassRoot';
import { createIframeRoot } from 'proton-pass-extension/app/content/injections/iframe/create-iframe-root';
import { createPopoverController } from 'proton-pass-extension/app/content/services/iframes/popover';
import {
    type IFrameAppService,
    IFramePortMessageType,
    type InjectedDropdown,
    type InjectedNotification,
} from 'proton-pass-extension/app/content/types';

import { PassThemeOption } from '@proton/pass/components/Layout/Theme/types';
import { matchDarkTheme } from '@proton/pass/components/Layout/Theme/utils';
import { PASS_DEFAULT_THEME } from '@proton/pass/constants';
import type { MaybeNull } from '@proton/pass/types';
import type { PassElementsConfig } from '@proton/pass/types/utils/dom';
import type { CustomElementRef } from '@proton/pass/utils/dom/create-element';
import { POPOVER_SUPPORTED, getActiveModal, getClosestModal } from '@proton/pass/utils/dom/popover';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import { logger } from '@proton/pass/utils/logger';
import { resolveDomain } from '@proton/pass/utils/url/utils';

import { createDropdown } from './dropdown';
import { createNotification } from './notification';

type IFrameServiceState = {
    apps: { dropdown: MaybeNull<InjectedDropdown>; notification: MaybeNull<InjectedNotification> };
    root: MaybeNull<CustomElementRef<ProtonPassRoot>>;
};

export interface IFrameService {
    dropdown: MaybeNull<InjectedDropdown>;
    notification: MaybeNull<InjectedNotification>;
    root: CustomElementRef<ProtonPassRoot>;
    attachDropdown: (anchor: HTMLElement) => MaybeNull<InjectedDropdown>;
    attachNotification: () => MaybeNull<InjectedNotification>;
    destroy: () => void;
    ensureInteractive: (anchor: MaybeNull<HTMLElement>, killswitch: boolean) => void;
    init: (rootAnchor?: HTMLElement) => CustomElementRef<ProtonPassRoot>;
    setTheme: (theme?: PassThemeOption) => void;
}

const shouldUsePopover = withContext<() => boolean>((ctx) => {
    return POPOVER_SUPPORTED && !(ctx?.getFeatureFlags().PassContentScriptPopoverKillSwitch ?? false);
});

export const createIFrameService = (elements: PassElementsConfig) => {
    const listeners = createListenerStore();

    const state: IFrameServiceState = {
        apps: { dropdown: null, notification: null },
        root: null,
    };

    const getIFrameTheme = (theme: PassThemeOption = PASS_DEFAULT_THEME) =>
        theme === PassThemeOption.OS ? PassThemeOption[matchDarkTheme().matches ? 'PassDark' : 'PassLight'] : theme;

    /* only re-init the iframe sub-apps if the extension context port has changed */
    const onAttached: <T extends IFrameAppService<any>>(app: T) => void = withContext((ctx, app) => {
        const port = ctx?.getExtensionContext()?.port;
        const url = ctx?.getExtensionContext()?.url;

        if (url && port && app.getState().port !== port) {
            const settings = ctx.getSettings();

            app.init(port, () => ({
                appState: ctx.getState(),
                domain: resolveDomain(url) ?? '',
                features: ctx.getFeatureFlags(),
                settings: ctx.getSettings(),
                theme: getIFrameTheme(settings.theme),
            }));
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

        /** Modal dialogs block interaction with elements outside their DOM tree.
         * Ensures root elements remain interactive with modal contexts by moving them
         * into the appropriate DOM subtree. When given an anchor, finds the modal
         * containing that element. Without an anchor, targets the topmost active modal.
         * Falls back to `document.body` when no modal context exists.  */
        ensureInteractive: (anchor, usePopover) => {
            if (usePopover) {
                const activeRoot = state.root;
                const nextParent = (anchor ? getClosestModal(anchor) : getActiveModal()) ?? document.body;
                const parent = activeRoot?.customElement.parentElement;

                if (parent !== nextParent) {
                    service.destroy();
                    if (activeRoot) parent?.removeChild(activeRoot.customElement);
                    service.init(nextParent);
                }
            }
        },

        init: (target) => {
            if (state.root) return state.root;

            state.root = createIframeRoot(elements.root, target);
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

            const handleColorSchemeChange = withContext((ctx) => {
                const settings = ctx?.getSettings();
                if (settings?.theme === PassThemeOption.OS) service.setTheme(settings.theme);
            });

            listeners.addListener(state.root.customElement, PASS_ROOT_REMOVED_EVENT as any, handleRootRemoval, {
                once: true,
            });
            listeners.addListener(matchDarkTheme(), 'change', handleColorSchemeChange);

            return state.root;
        },

        destroy: () => {
            listeners.removeAll();
            state.apps.dropdown?.destroy();
            state.apps.notification?.destroy();
            state.root = null; /* reset in-case we recycle the content-script */
        },

        attachDropdown: withContext((ctx, anchor) => {
            if (!ctx) return null;

            const usePopover = shouldUsePopover();
            service.ensureInteractive(anchor, usePopover);

            if (state.apps.dropdown === null) {
                logger.debug(`[ContentScript::${ctx.scriptId}] attaching dropdown iframe`);
                state.apps.dropdown = createDropdown({
                    popover: createPopoverController(service, usePopover),
                    onDestroy: () => (state.apps.dropdown = null),
                });

                onAttached(state.apps.dropdown);
            }

            return state.apps.dropdown;
        }),

        attachNotification: withContext((ctx) => {
            if (!ctx) return null;

            const usePopover = shouldUsePopover();
            service.ensureInteractive(null, usePopover);

            if (state.apps.notification === null) {
                logger.debug(`[ContentScript::${ctx.scriptId}] attaching notification iframe`);

                state.apps.notification = createNotification({
                    popover: createPopoverController(service, usePopover),
                    onDestroy: () => (state.apps.notification = null),
                });

                onAttached(state.apps.notification);
            }

            return state.apps.notification;
        }),

        setTheme: (theme = PASS_DEFAULT_THEME) => {
            state.root?.customElement.setAttribute(
                PASS_ELEMENT_THEME,
                ((): string => {
                    switch (theme) {
                        case PassThemeOption.PassDark:
                            return 'dark';
                        case PassThemeOption.PassLight:
                            return 'light';
                        case PassThemeOption.OS:
                            return 'os';
                    }
                })()
            );

            const payload = (() => {
                if (theme === PassThemeOption.OS) {
                    return matchDarkTheme().matches ? PassThemeOption.PassDark : PassThemeOption.PassLight;
                }
                return theme;
            })();

            state.apps.dropdown?.sendMessage({ type: IFramePortMessageType.IFRAME_THEME, payload });
            state.apps.notification?.sendMessage({ type: IFramePortMessageType.IFRAME_THEME, payload });
        },
    };

    return service;
};

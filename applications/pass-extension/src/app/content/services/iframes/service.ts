import { PASS_ROOT_REMOVED_EVENT } from 'proton-pass-extension/app/content/constants.static';
import { withContext } from 'proton-pass-extension/app/content/context/context';
import { PASS_ELEMENT_THEME } from 'proton-pass-extension/app/content/injections/custom-elements/ProtonPassElement';
import type { ProtonPassRoot } from 'proton-pass-extension/app/content/injections/custom-elements/ProtonPassRoot';
import { IFramePortMessageType } from 'proton-pass-extension/app/content/services/iframes/messages';
import type { PopoverController } from 'proton-pass-extension/app/content/services/iframes/popover';
import { createPopoverController } from 'proton-pass-extension/app/content/services/iframes/popover';
import { createIframeRoot } from 'proton-pass-extension/app/content/services/iframes/utils';

import { PassThemeOption } from '@proton/pass/components/Layout/Theme/types';
import { matchDarkTheme } from '@proton/pass/components/Layout/Theme/utils';
import { PASS_DEFAULT_THEME } from '@proton/pass/constants';
import type { MaybeNull } from '@proton/pass/types';
import type { PassElementsConfig } from '@proton/pass/types/utils/dom';
import type { CustomElementRef } from '@proton/pass/utils/dom/create-element';
import { POPOVER_SUPPORTED, getActiveModal, getClosestModal } from '@proton/pass/utils/dom/popover';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import { logger } from '@proton/pass/utils/logger';
import { resolveSubdomain } from '@proton/pass/utils/url/utils';

import type { InjectedDropdown } from './dropdown';
import { createDropdown } from './dropdown';
import type { InjectedNotification } from './notification';
import { createNotification } from './notification';

type IFrameRegistry = {
    apps: { dropdown: MaybeNull<InjectedDropdown>; notification: MaybeNull<InjectedNotification> };
    popover: MaybeNull<PopoverController>;
    root: MaybeNull<CustomElementRef<ProtonPassRoot>>;
};

export interface IFrameService {
    popover: PopoverController;
    dropdown: MaybeNull<InjectedDropdown>;
    notification: MaybeNull<InjectedNotification>;
    root: CustomElementRef<ProtonPassRoot>;
    attachDropdown: (layer?: HTMLElement) => MaybeNull<InjectedDropdown>;
    attachNotification: () => MaybeNull<InjectedNotification>;
    destroy: () => void;
    ensureInteractive: (anchor: MaybeNull<HTMLElement>) => void;
    init: (rootAnchor?: HTMLElement) => CustomElementRef<ProtonPassRoot>;
    setTheme: (theme?: PassThemeOption) => void;
}

export const createIFrameService = (elements: PassElementsConfig) => {
    const listeners = createListenerStore();

    const registry: IFrameRegistry = {
        apps: { dropdown: null, notification: null },
        popover: null,
        root: null,
    };

    const getIFrameTheme = (theme: PassThemeOption = PASS_DEFAULT_THEME) =>
        theme === PassThemeOption.OS ? PassThemeOption[matchDarkTheme().matches ? 'PassDark' : 'PassLight'] : theme;

    /* only re-init the iframe sub-apps if the extension context port has changed */
    const onAttached: (id: keyof IFrameRegistry['apps']) => void = withContext((ctx, id) => {
        const service = registry.apps[id];
        if (!service) return;

        const port = ctx?.getExtensionContext()?.port;
        const url = ctx?.getExtensionContext()?.url;

        if (url && port && service.getState().port !== port) {
            const settings = ctx.getSettings();

            service.init(port, () => ({
                appState: ctx.getState(),
                domain: resolveSubdomain(url) ?? '',
                features: ctx.getFeatureFlags(),
                settings: ctx.getSettings(),
                theme: getIFrameTheme(settings.theme),
            }));

            service.subscribe((e) => e.type === 'destroy' && (registry.apps[id] = null));
        }
    });

    const service: IFrameService = {
        get popover() {
            return registry.popover ?? (registry.popover = createPopoverController(service));
        },

        get dropdown() {
            return registry.apps.dropdown;
        },

        get notification() {
            return registry.apps.notification;
        },

        get root() {
            return registry.root ?? service.init();
        },

        /** Modal dialogs block interaction with elements outside their DOM tree.
         * Ensures root elements remain interactive with modal contexts by moving them
         * into the appropriate DOM subtree. When given an anchor, finds the modal
         * containing that element. Without an anchor, targets the topmost active modal.
         * Falls back to `document.body` when no modal context exists.  */
        ensureInteractive: (anchor) => {
            if (POPOVER_SUPPORTED) {
                const activeRoot = registry.root;
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
            if (registry.root) return registry.root;

            listeners.removeAll();
            registry.root = createIframeRoot(elements.root, target);
            registry.popover = createPopoverController(service);

            if (registry.apps.dropdown) onAttached('dropdown');
            if (registry.apps.notification) onAttached('notification');

            const handleRootRemoval = withContext((ctx) => {
                registry.root = null;
                registry.popover = null;
                registry.apps.dropdown?.destroy();
                registry.apps.notification?.destroy();
                registry.apps.dropdown = null;
                registry.apps.notification = null;

                if (!ctx?.getState().stale) service.init();
                else service.destroy();
            });

            const handleColorSchemeChange = withContext((ctx) => {
                const settings = ctx?.getSettings();
                if (settings?.theme === PassThemeOption.OS) service.setTheme(settings.theme);
            });

            const customEl = registry.root.customElement;

            listeners.addListener(customEl, PASS_ROOT_REMOVED_EVENT as any, handleRootRemoval, { once: true });
            listeners.addListener(matchDarkTheme(), 'change', handleColorSchemeChange);

            return registry.root;
        },

        destroy: () => {
            listeners.removeAll();
            registry.apps.dropdown?.destroy();
            registry.apps.notification?.destroy();
            registry.root = null; /* reset in-case we recycle the content-script */
            registry.popover = null;
        },

        attachDropdown: withContext((ctx, layer) => {
            if (!ctx) return null;
            if (layer) service.ensureInteractive(layer);

            if (registry.apps.dropdown === null) {
                logger.debug(`[ContentScript::${ctx.scriptId}] attaching dropdown iframe`);
                registry.apps.dropdown = createDropdown(service.popover);
                onAttached('dropdown');
            }

            return registry.apps.dropdown;
        }),

        attachNotification: withContext((ctx) => {
            if (!ctx) return null;
            service.ensureInteractive(null);

            if (registry.apps.notification === null) {
                logger.debug(`[ContentScript::${ctx.scriptId}] attaching notification iframe`);
                registry.apps.notification = createNotification(service.popover);
                onAttached('notification');
            }

            return registry.apps.notification;
        }),

        setTheme: (theme = PASS_DEFAULT_THEME) => {
            registry.root?.customElement.setAttribute(
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

            registry.apps.dropdown?.sendMessage({ type: IFramePortMessageType.IFRAME_THEME, payload });
            registry.apps.notification?.sendMessage({ type: IFramePortMessageType.IFRAME_THEME, payload });
        },
    };

    return service;
};

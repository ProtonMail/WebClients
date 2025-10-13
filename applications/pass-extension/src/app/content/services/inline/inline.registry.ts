import { PASS_ROOT_REMOVED_EVENT } from 'proton-pass-extension/app/content/constants.static';
import { withContext } from 'proton-pass-extension/app/content/context/context';

import { PassThemeOption } from '@proton/pass/components/Layout/Theme/types';
import { matchDarkTheme } from '@proton/pass/components/Layout/Theme/utils';
import { PASS_DEFAULT_THEME } from '@proton/pass/constants';
import type { MaybeNull } from '@proton/pass/types';
import type { PassElementsConfig } from '@proton/pass/types/utils/dom';
import { type CustomElementRef, createCustomElement } from '@proton/pass/utils/dom/create-element';
import { POPOVER_SUPPORTED, getActiveModal, getClosestModal } from '@proton/pass/utils/dom/popover';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import { logger } from '@proton/pass/utils/logger';
import { resolveSubdomain } from '@proton/pass/utils/url/utils';

import { PASS_ELEMENT_THEME } from './custom-elements/ProtonPassElement';
import type { ProtonPassRoot } from './custom-elements/ProtonPassRoot';
import type { DropdownApp } from './dropdown/dropdown.app';
import { createDropdown } from './dropdown/dropdown.app';
import { InlinePortMessageType } from './inline.messages';
import type { PopoverController } from './inline.popover';
import { createPopoverController } from './inline.popover';
import type { NotificationApp } from './notification/notification.app';
import { createNotification } from './notification/notification.app';

import ProtonPassRootStyles from './custom-elements/ProtonPassRoot.raw.scss';

type InlineRegistryState = {
    apps: { dropdown: MaybeNull<DropdownApp>; notification: MaybeNull<NotificationApp> };
    popover: MaybeNull<PopoverController>;
    root: MaybeNull<CustomElementRef<ProtonPassRoot>>;
};

export interface InlineRegistry {
    popover: PopoverController;
    dropdown: MaybeNull<DropdownApp>;
    notification: MaybeNull<NotificationApp>;
    root: CustomElementRef<ProtonPassRoot>;
    attachDropdown: (layer?: HTMLElement) => MaybeNull<DropdownApp>;
    attachNotification: () => MaybeNull<NotificationApp>;
    destroy: () => void;
    ensureInteractive: (anchor: MaybeNull<HTMLElement>) => void;
    init: (rootAnchor?: HTMLElement) => CustomElementRef<ProtonPassRoot>;
    setTheme: (theme?: PassThemeOption) => void;
}

const createIframeRoot = (rootTag: string, target?: HTMLElement) =>
    createCustomElement<ProtonPassRoot>({
        type: rootTag,
        parent: target ?? document.body,
        styles: ProtonPassRootStyles,
    });

export const createInlineRegistry = (elements: PassElementsConfig) => {
    const listeners = createListenerStore();

    const state: InlineRegistryState = {
        apps: { dropdown: null, notification: null },
        popover: null,
        root: null,
    };

    const getIFrameTheme = (theme: PassThemeOption = PASS_DEFAULT_THEME) =>
        theme === PassThemeOption.OS ? PassThemeOption[matchDarkTheme().matches ? 'PassDark' : 'PassLight'] : theme;

    /* only re-init the iframe sub-apps if the extension context port has changed */
    const onAttached: (id: keyof InlineRegistryState['apps']) => void = withContext((ctx, id) => {
        const service = state.apps[id];
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

            service.subscribe((e) => e.type === 'destroy' && (state.apps[id] = null));
        }
    });

    const registry: InlineRegistry = {
        get popover() {
            return state.popover ?? (state.popover = createPopoverController(registry));
        },

        get dropdown() {
            return state.apps.dropdown;
        },

        get notification() {
            return state.apps.notification;
        },

        get root() {
            return state.root ?? registry.init();
        },

        /** Modal dialogs block interaction with elements outside their DOM tree.
         * Ensures root elements remain interactive with modal contexts by moving them
         * into the appropriate DOM subtree. When given an anchor, finds the modal
         * containing that element. Without an anchor, targets the topmost active modal.
         * Falls back to `document.body` when no modal context exists.  */
        ensureInteractive: (anchor) => {
            if (POPOVER_SUPPORTED) {
                const activeRoot = state.root;
                const nextParent = (anchor ? getClosestModal(anchor) : getActiveModal()) ?? document.body;
                const parent = activeRoot?.customElement.parentElement;

                if (parent !== nextParent) {
                    registry.destroy();
                    if (activeRoot) parent?.removeChild(activeRoot.customElement);
                    registry.init(nextParent);
                }
            }
        },

        init: (target) => {
            if (state.root) return state.root;

            listeners.removeAll();
            state.root = createIframeRoot(elements.root, target);
            state.popover = createPopoverController(registry);

            if (state.apps.dropdown) onAttached('dropdown');
            if (state.apps.notification) onAttached('notification');

            const handleRootRemoval = withContext((ctx) => {
                state.root = null;
                state.popover = null;
                state.apps.dropdown?.destroy();
                state.apps.notification?.destroy();
                state.apps.dropdown = null;
                state.apps.notification = null;

                if (!ctx?.getState().stale) registry.init();
                else registry.destroy();
            });

            const handleColorSchemeChange = withContext((ctx) => {
                const settings = ctx?.getSettings();
                if (settings?.theme === PassThemeOption.OS) registry.setTheme(settings.theme);
            });

            const customEl = state.root.customElement;

            listeners.addListener(customEl, PASS_ROOT_REMOVED_EVENT as any, handleRootRemoval, { once: true });
            listeners.addListener(matchDarkTheme(), 'change', handleColorSchemeChange);

            return state.root;
        },

        destroy: () => {
            listeners.removeAll();
            state.apps.dropdown?.destroy();
            state.apps.notification?.destroy();
            state.root = null; /* reset in-case we recycle the content-script */
            state.popover = null;
        },

        attachDropdown: withContext((ctx, layer) => {
            if (!ctx) return null;
            if (layer) registry.ensureInteractive(layer);

            if (state.apps.dropdown === null) {
                logger.debug(`[ContentScript::${ctx.scriptId}] attaching dropdown iframe`);
                state.apps.dropdown = createDropdown(registry.popover);
                onAttached('dropdown');
            }

            return state.apps.dropdown;
        }),

        attachNotification: withContext((ctx) => {
            if (!ctx) return null;
            registry.ensureInteractive(null);

            if (state.apps.notification === null) {
                logger.debug(`[ContentScript::${ctx.scriptId}] attaching notification iframe`);
                state.apps.notification = createNotification(registry.popover);
                onAttached('notification');
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

            state.apps.dropdown?.sendMessage({ type: InlinePortMessageType.IFRAME_THEME, payload });
            state.apps.notification?.sendMessage({ type: InlinePortMessageType.IFRAME_THEME, payload });
        },
    };

    return registry;
};

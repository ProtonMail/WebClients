import { PassThemeOption } from '@proton/pass/components/Layout/Theme/types';
import { matchDarkTheme } from '@proton/pass/components/Layout/Theme/utils';
import { PASS_DEFAULT_THEME } from '@proton/pass/constants';
import { resolveSubdomain } from '@proton/pass/lib/urls/utils/utils';
import type { Callback, MaybeNull } from '@proton/pass/types/utils';
import type { PassElementsConfig } from '@proton/pass/types/utils/dom';
import { type CustomElementRef, createCustomElement } from '@proton/pass/utils/dom/create-element';
import { POPOVER_SUPPORTED, getActiveModal, getClosestModal } from '@proton/pass/utils/dom/popover';
import { safeCall } from '@proton/pass/utils/fp/safe-call';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import { logger } from '@proton/pass/utils/logger';

import { PASS_ROOT_REMOVED_EVENT, kFocusTrapSelector } from '../../constants.static';
import { withContext } from '../../context/context';
import { PASS_ELEMENT_THEME } from './custom-elements/ProtonPassElement';
import type { ProtonPassRoot } from './custom-elements/ProtonPassRoot';
import type { DropdownApp } from './dropdown/dropdown.app';
import { createDropdown } from './dropdown/dropdown.app';
import { InlinePortMessageType } from './inline.messages';
import type { PopoverController } from './inline.popover';
import { createPopoverController } from './inline.popover';
import type { InlineToastApp } from './toast/toast.app';
import { createToastApp } from './toast/toast.app';

import ProtonPassRootStyles from './custom-elements/ProtonPassRoot.raw.scss';

type InlineRegistryState = {
    apps: { dropdown: MaybeNull<DropdownApp>; toast: MaybeNull<InlineToastApp> };
    popover: MaybeNull<PopoverController>;
    root: MaybeNull<CustomElementRef<ProtonPassRoot>>;
};

export interface InlineRegistry {
    popover: PopoverController;
    dropdown: MaybeNull<DropdownApp>;
    toast: MaybeNull<InlineToastApp>;
    root: CustomElementRef<ProtonPassRoot>;
    attachDropdown: (layer?: HTMLElement) => MaybeNull<DropdownApp>;
    attachToast: () => MaybeNull<InlineToastApp>;
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

const getClosestFocusTrap = (target: MaybeNull<Element>) => target?.closest<HTMLElement>(kFocusTrapSelector) ?? null;

export const createInlineRegistry = (elements: PassElementsConfig) => {
    const listeners = createListenerStore();

    const state: InlineRegistryState = {
        apps: { dropdown: null, toast: null },
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
        const url = ctx?.getExtensionContext()?.frameUrl;

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

        get toast() {
            return state.apps.toast;
        },

        get root() {
            return state.root ?? registry.init();
        },

        /** Ensures password manager UI remains interactive within focus-trapped modal
         * contexts. Focus-trap libraries (focus-lock, focus-trap, a11y-dialog) and modal
         * dialogs restrict keyboard/focus interaction to elements within their DOM subtree.
         * By dynamically relocating our root element into the active modal's tree, we cooperate
         * with the page's focus management instead of conflicting with it. */
        ensureInteractive: (anchor) => {
            if (POPOVER_SUPPORTED) {
                const activeRoot = state.root;
                const nextParent =
                    (anchor
                        ? (getClosestModal(anchor) ?? getClosestFocusTrap(anchor))
                        : (getActiveModal() ?? getClosestFocusTrap(document.activeElement))) ?? document.body;

                const parent = activeRoot?.customElement.parentElement;

                if (parent !== nextParent) {
                    registry.destroy();
                    registry.init(nextParent);
                }
            }
        },

        init: (target) => {
            if (state.root) return state.root;

            listeners.removeAll();
            state.root = createIframeRoot(elements.root, target);
            state.popover = createPopoverController(registry);
            const { customElement } = state.root;

            if (state.apps.dropdown) onAttached('dropdown');
            if (state.apps.toast) onAttached('toast');

            const onRootRemoved = withContext((ctx) => {
                state.root = null;
                state.popover = null;
                state.apps.dropdown?.destroy();
                state.apps.toast?.destroy();
                state.apps.dropdown = null;
                state.apps.toast = null;

                if (!ctx?.getState().stale) registry.init();
                else registry.destroy();
            });

            const setTheme = withContext<Callback>((ctx) => {
                const settings = ctx?.getSettings();
                registry.setTheme(settings?.theme);
            });

            listeners.addListener(customElement, PASS_ROOT_REMOVED_EVENT as any, onRootRemoved, { once: true });
            listeners.addListener(matchDarkTheme(), 'change', setTheme);
            setTheme();

            return state.root;
        },

        destroy: () => {
            listeners.removeAll();
            state.apps.dropdown?.destroy();
            state.apps.toast?.destroy();

            safeCall(() => state.root?.customElement.remove())();
            state.root = null;
            state.popover = null;
        },

        attachDropdown: withContext((ctx, layer) => {
            if (!ctx) return null;
            registry.ensureInteractive(layer ?? null);

            if (state.apps.dropdown === null) {
                logger.debug(`[ContentScript::${ctx.scriptId}] attaching dropdown iframe`);
                state.apps.dropdown = createDropdown(registry.popover);
                onAttached('dropdown');
            }

            return state.apps.dropdown;
        }),

        attachToast: withContext((ctx) => {
            if (!ctx) return null;
            registry.ensureInteractive(null);

            if (state.apps.toast === null) {
                logger.debug(`[ContentScript::${ctx.scriptId}] attaching toast iframe`);
                state.apps.toast = createToastApp(registry.popover);
                onAttached('toast');
            }

            return state.apps.toast;
        }),

        setTheme: (theme = PASS_DEFAULT_THEME) => {
            const [injectionTheme, payload] = (() => {
                switch (theme) {
                    case PassThemeOption.PassDark:
                        return ['dark', theme] as const;
                    case PassThemeOption.PassLight:
                        return ['light', theme] as const;
                    case PassThemeOption.OS:
                        const isDark = matchDarkTheme().matches;
                        const match = isDark ? PassThemeOption.PassDark : PassThemeOption.PassLight;
                        return ['os', match] as const;
                }
            })();

            state.root?.customElement.setAttribute(PASS_ELEMENT_THEME, injectionTheme);
            state.apps.dropdown?.sendMessage({ type: InlinePortMessageType.IFRAME_THEME, payload });
            state.apps.toast?.sendMessage({ type: InlinePortMessageType.IFRAME_THEME, payload });
        },
    };

    return registry;
};

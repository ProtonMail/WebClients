import {
    ACTIVE_ICON_SRC,
    COUNTER_ICON_SRC,
    DISABLED_ICON_SRC,
    DropdownAction,
    LOCKED_ICON_SRC,
} from 'proton-pass-extension/app/content/constants.runtime';
import { withContext } from 'proton-pass-extension/app/content/context/context';
import type { FieldHandle } from 'proton-pass-extension/app/content/services/form/field';
import { FIELD_ATTRS_FILTER } from 'proton-pass-extension/app/content/services/form/field.utils';
import { getFrameAttributes } from 'proton-pass-extension/app/content/utils/frame';
import { contentScriptMessage, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { clientDisabled, clientLocked } from '@proton/pass/lib/client';
import type { AppStatus, Callback, MaybeNull } from '@proton/pass/types';
import { animatePositionChange, freezeAnimations, waitForTransitions } from '@proton/pass/utils/dom/animation';
import { isInputElement } from '@proton/pass/utils/dom/predicates';
import { safeAsyncCall, safeCall } from '@proton/pass/utils/fp/safe-call';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import debounce from '@proton/utils/debounce';
import noop from '@proton/utils/noop';

import type { IconStyles } from './icon.utils';
import {
    applyIconInjectionStyles,
    cleanupInputStyles,
    computeIconInjectionStyles,
    createIcon,
    hasIconInjectionStylesChanged,
} from './icon.utils';

type IconControllerOptions = {
    mainFrame: boolean;
    field: FieldHandle;
    /** `protonpass-control` custom element tag name */
    tag: string;
    onClick: () => void;
    onDetach: () => void;
};

export interface IconController {
    element: HTMLElement;
    detach: () => void;
    reposition: () => void;
    sync: () => void;
}

export type IconState = {
    abortCtrl: MaybeNull<AbortController>;
    containerObserver: MaybeNull<ResizeObserver>;
    inputObserver: MaybeNull<ResizeObserver>;
    repositionRaf: number;
    reflow: boolean;
    styles: MaybeNull<IconStyles>;
    releaseTransitions: MaybeNull<() => void>;
};

const MIN_FIELD_WIDTH = 100;

export const createIconController = (options: IconControllerOptions): MaybeNull<IconController> => {
    const { field, tag } = options;
    const input = field.element;
    const form = field.getFormHandle().element;
    const anchor = field.getAnchor({ reflow: true });
    const zIndex = field.getFormHandle().zIndex;

    if (!isInputElement(input)) return null;

    const container = (() => {
        const noAnchor = anchor.element === input;
        const parentEl = noAnchor ? input.parentElement! : anchor.element;
        return parentEl;
    })();

    const listeners = createListenerStore();
    const { icon, control } = createIcon({ parent: container, zIndex, tag });

    const state: IconState = {
        abortCtrl: null,
        containerObserver: null,
        inputObserver: null,
        repositionRaf: -1,
        reflow: false,
        styles: null,
        releaseTransitions: null,
    };

    const reflow =
        <T extends Callback>(fn: T) =>
        (...args: Parameters<T>) => {
            state.reflow = true;
            fn(...args);
        };

    const setStatus = (status: AppStatus) => {
        let iconUrl = (() => {
            if (clientLocked(status)) return LOCKED_ICON_SRC;
            if (clientDisabled(status)) return DISABLED_ICON_SRC;
            return ACTIVE_ICON_SRC;
        })();

        /** Safari/WebKit bug: Extension resources loaded via `safari-extension://` URLs in
         * shadow DOM contexts (particularly iframes) fail to repaint when toggling visibility.
         * The compositor layer becomes stale despite successful resource loading. Cache-busting
         * forces a fresh render pass. See: intermittent rendering on show/hide, but renders
         * correctly after tab switches (which trigger full repaints). */
        if (BUILD_TARGET === 'safari' && !options.mainFrame) {
            iconUrl += `?v=${field.fieldId}-${+Date.now()}`;
        }

        icon.style.setProperty('background-image', `url("${iconUrl}")`, 'important');
    };

    const setCount = (count: number) => {
        const safeCount = count === 0 || !count ? '' : String(count);
        icon.style.setProperty(`--control-count`, `"${safeCount}"`);
        if (count > 0) icon.style.setProperty('background-image', `url("${COUNTER_ICON_SRC}")`, 'important');
    };

    const sync = withContext((ctx) => {
        if (!ctx) return;

        const { authorized, status } = ctx.getState();
        setStatus(status);

        const showCounter = field.action?.type === DropdownAction.AUTOFILL_LOGIN && authorized;

        if (!showCounter) setCount(0);
        else ctx.service.autofill.getCredentialsCount().then(setCount).catch(noop);
    });

    const checkParentCollision = safeAsyncCall(
        withContext<(styles: IconStyles, ctrl: AbortController) => Promise<void>>(async (ctx, styles, ctrl) => {
            if (!ctx || ctx.mainFrame || ctrl.signal.aborted) return;

            const frameAttributes = getFrameAttributes();
            const maxWidth = anchor.element.offsetWidth;
            const { top, left, radius } = styles.icon.overlay;

            await sendMessage
                .onSuccess(
                    contentScriptMessage({
                        type: WorkerMessageType.INLINE_ICON_SHIFT,
                        payload: { type: 'initial', top, left, radius, frameAttributes, maxWidth },
                    }),
                    ({ dx }) => {
                        if (ctrl.signal.aborted || dx <= 0) return;
                        const delta = Math.abs(dx - styles.icon.overlay.dx);
                        styles.icon.right += delta + styles.icon.overlay.gap;
                    }
                )
                .catch(noop);
        })
    );

    const reposition = () => {
        /** Store reflow in case current request gets canceled */
        cancelAnimationFrame(state.repositionRaf);

        /** Dual cancellation strategy: RAF cancellation prevents future callbacks
         * from executing, but if a RAF is already running and has reached async
         * operations (waitUntil, checkParentCollision), AbortController signals
         * these operations to bail out, preventing stale positioning attempts */
        const ctrl = new AbortController();
        state.abortCtrl?.abort();
        state.abortCtrl = ctrl;

        state.repositionRaf = requestAnimationFrame(async () => {
            const anchor = field.getAnchor({ reflow: state.reflow });
            state.reflow = false;

            if (input.offsetWidth < MIN_FIELD_WIDTH) {
                icon.classList.remove('visible');
                return;
            }

            /** Wait for anchor animations to stabilize before repositioning.
             * Computing the icon injection styles will mutate the input's
             * inline styles which may interfere with ongoing transitions */
            await waitForTransitions(container);

            if (!ctrl.signal.aborted) {
                const refs = { icon, control, input, anchor: anchor.element, form };

                animatePositionChange({
                    onAnimate: (raf) => (state.repositionRaf = raf),
                    onComplete: async () => {
                        /** Positioning the anchor will mutate the element styles,
                         * to avoid cascading async resize events, pause the affected
                         * ResizeObservers when computing/applying injection styles
                         * and freeze the target elements to block any animations. */
                        state.inputObserver?.disconnect();
                        state.containerObserver?.disconnect();

                        state.releaseTransitions =
                            state.releaseTransitions ??
                            (() => {
                                const releaseContainer = freezeAnimations(container);
                                const releaseInput = freezeAnimations(input);

                                return () => {
                                    releaseContainer();
                                    releaseInput();
                                    state.releaseTransitions = null;
                                };
                            })();

                        const styles = computeIconInjectionStyles(refs);

                        if (!options.mainFrame) await checkParentCollision(styles, ctrl);
                        if (ctrl.signal.aborted) return;

                        /** Only apply if there's a non-negligable change */
                        state.styles = hasIconInjectionStylesChanged(state.styles, styles) ? styles : state.styles;
                        if (state.styles) applyIconInjectionStyles(refs, state.styles);

                        state.abortCtrl = null;
                        icon.classList.add('visible');

                        /** Wait for next frame after styles are applied while animations are frozen.
                         * This ensures observers resume and transitions are released only after
                         * the current positioning changes have been fully rendered */
                        state.repositionRaf = requestAnimationFrame(() => {
                            if (!ctrl.signal.aborted) {
                                state.inputObserver?.observe(input);
                                state.containerObserver?.observe(container);
                                state.releaseTransitions?.();
                            }
                        });
                    },
                    get: () => input.getBoundingClientRect(),
                });
            }
        });
    };

    const onPointerDown = (evt: PointerEvent) => {
        icon.setPointerCapture(evt.pointerId);
        evt.preventDefault();
        evt.stopPropagation();
        options.onClick();
    };

    const onPointerUp = (evt: PointerEvent) => {
        /** Release pointer capture and prevent any residual click events */
        icon.releasePointerCapture(evt.pointerId);
        evt.preventDefault();
        evt.stopPropagation();
    };

    const detach = safeCall(() => {
        cancelAnimationFrame(state.repositionRaf);
        state.abortCtrl?.abort();
        state.abortCtrl = null;
        state.styles = null;
        icon.classList.remove('visible');

        listeners.removeAll();
        state.containerObserver?.disconnect();
        state.inputObserver?.disconnect();
        state.releaseTransitions?.();

        options.onDetach();

        field.setIcon(null);

        icon.remove();
        control.remove();

        cleanupInputStyles(input);
    });

    const debouncedReposition = debounce(reposition, 150, { leading: true, trailing: true });

    /** Uses pointer capture to prevent unintended clicks during icon repositioning.
     * Captures on pointerdown, releases on pointerup to handle repositioning mid-interaction. */
    listeners.addListener(icon, 'pointerdown', onPointerDown);
    listeners.addListener(icon, 'pointerup', onPointerUp);
    listeners.addListener(window, 'resize', debouncedReposition);

    /** DOM mutations may affect field layout (error messages, tooltips, icons).
     * Revalidate anchor element positioning with reflow=true to ensure
     * icon remains correctly positioned relative to potentially changed boundaries. */
    listeners.addObserver(container, reflow(debouncedReposition), { childList: true, subtree: true });
    listeners.addObserver(input, debouncedReposition, FIELD_ATTRS_FILTER);
    listeners.addResizeObserver(field.getFormHandle().element, debouncedReposition, { passive: true });

    /** `passive` flag allows not firing resize observer callbacks
     * when observation starts (avoids repositioning cascade). We
     * observe both the input and the container for repositioning. */
    state.inputObserver = listeners.addResizeObserver(input, debouncedReposition, { passive: true });
    state.containerObserver = listeners.addResizeObserver(container, reflow(debouncedReposition), { passive: true });

    sync();
    reposition();

    return {
        element: icon,
        detach,
        reposition,
        sync,
    };
};

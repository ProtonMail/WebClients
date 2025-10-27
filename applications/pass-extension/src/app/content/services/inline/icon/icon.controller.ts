import {
    ACTIVE_ICON_SRC,
    COUNTER_ICON_SRC,
    DISABLED_ICON_SRC,
    LOCKED_ICON_SRC,
} from 'proton-pass-extension/app/content/constants.runtime';
import { withContext } from 'proton-pass-extension/app/content/context/context';
import type { FieldHandle } from 'proton-pass-extension/app/content/services/form/field';
import { getFrameAttributes } from 'proton-pass-extension/app/content/utils/frame';
import { contentScriptMessage, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { FieldType, FormType } from '@proton/pass/fathom/labels';
import { clientDisabled, clientLocked } from '@proton/pass/lib/client';
import type { AppStatus, MaybeNull } from '@proton/pass/types';
import { animatePositionChange, freezeAnimations, waitForTransitions } from '@proton/pass/utils/dom/animation';
import { isInputElement } from '@proton/pass/utils/dom/predicates';
import { safeAsyncCall, safeCall } from '@proton/pass/utils/fp/safe-call';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
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
    sync: () => void;
}

export type IconState = {
    abortCtrl: MaybeNull<AbortController>;
    container: HTMLElement;
    containerObserver: MaybeNull<ResizeObserver>;
    inputObserver: MaybeNull<ResizeObserver>;
    repositionRaf: number;
    repositionReflow: boolean;
    styles: MaybeNull<IconStyles>;
    releaseTransitions: MaybeNull<() => void>;
};

export const createIconController = (options: IconControllerOptions): MaybeNull<IconController> => {
    const { field, tag } = options;
    const input = field.element;
    const zIndex = field.getFormHandle().zIndex;

    if (!isInputElement(input)) return null;

    const parent = (() => {
        /** TBD: instead of injecting the icon next to the anchor (either the input element
         * or the resolved bounding element), prefer injecting in the form's scroll child.
         * This should preserve z-index layering while avoiding interferences in websites
         * sensitive to the DOM structure of their input fields (eg: some websites expect
         * their input elements to always be the first child of a wrapper component, interfering
         * with this could cause unintented crashes) */
        const root = field.element.getRootNode();
        if (root instanceof ShadowRoot) return root;
        return field.getFormHandle().scrollChild;
    })();

    const listeners = createListenerStore();
    const anchor = field.getAnchor({ reflow: false });
    const { icon, control } = createIcon({ parent, zIndex, tag });

    /** Container element for repositioning triggers. Best-case we
     * just use the anchor element, else resolve the parent */
    const getContainer = () => (anchor.element === input ? input.parentElement! : anchor.element);

    const state: IconState = {
        abortCtrl: null,
        container: getContainer(),
        containerObserver: null,
        inputObserver: null,
        repositionRaf: -1,
        repositionReflow: false,
        styles: null,
        releaseTransitions: null,
    };

    const setStatus = (status: AppStatus) => {
        const iconUrl = (() => {
            if (clientLocked(status)) return LOCKED_ICON_SRC;
            if (clientDisabled(status)) return DISABLED_ICON_SRC;
            return ACTIVE_ICON_SRC;
        })();

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
        const { formType } = field.getFormHandle();
        const { fieldType } = field;

        setStatus(status);

        const showCounter =
            formType === FormType.LOGIN ||
            (formType === FormType.RECOVERY && [FieldType.USERNAME, FieldType.EMAIL].includes(fieldType));

        if (!showCounter) setCount(0);
        else {
            void Promise.resolve(authorized ? (ctx.service.autofill.getCredentialsCount() ?? 0) : 0)
                .then(setCount)
                .catch(noop);
        }
    });

    const checkParentCollision = safeAsyncCall(
        withContext<(styles: IconStyles, ctrl: AbortController) => Promise<void>>(async (ctx, styles, ctrl) => {
            if (!ctx || ctx.mainFrame || ctrl.signal.aborted) return;

            const frameAttributes = getFrameAttributes();
            const maxWidth = field.getAnchor().element.offsetWidth;
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

    const reposition = (reflow: boolean) => {
        /** Store reflow in case current request gets canceled */
        state.repositionReflow = reflow || state.repositionReflow;
        cancelAnimationFrame(state.repositionRaf);

        /** Dual cancellation strategy: RAF cancellation prevents future callbacks
         * from executing, but if a RAF is already running and has reached async
         * operations (waitUntil, checkParentCollision), AbortController signals
         * these operations to bail out, preventing stale positioning attempts */
        const ctrl = new AbortController();
        state.abortCtrl?.abort();
        state.abortCtrl = ctrl;

        state.repositionRaf = requestAnimationFrame(async () => {
            const anchor = field.getAnchor({ reflow: state.repositionReflow });
            const container = getContainer();

            if (container !== state.container) {
                state.releaseTransitions?.();
                state.container = container;
            }

            state.repositionReflow = false;

            /** Wait for anchor animations to stabilize before repositioning.
             * Computing the icon injection styles will mutate the input's
             * inline styles which may interfere with ongoing transitions */
            await waitForTransitions(state.container);

            if (!ctrl.signal.aborted) {
                const refs = { icon, control, input, anchor: anchor.element, parent };

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
                                const releaseContainer = freezeAnimations(state.container);
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
                                state.inputObserver?.observe(field.element);
                                state.containerObserver?.observe(state.container);
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

    /** Uses pointer capture to prevent unintended clicks during icon repositioning.
     * Captures on pointerdown, releases on pointerup to handle repositioning mid-interaction. */
    listeners.addListener(icon, 'pointerdown', onPointerDown);
    listeners.addListener(icon, 'pointerup', onPointerUp);
    listeners.addListener(window, 'resize', () => reposition(false));

    /** DOM mutations may affect field layout (error messages, tooltips, icons).
     * Revalidate anchor element positioning with reflow=true to ensure
     * icon remains correctly positioned relative to potentially changed boundaries. */
    listeners.addObserver(state.container, () => reposition(true), { childList: true, subtree: true });
    listeners.addResizeObserver(field.getFormHandle().element, () => reposition(true));

    /** `passive` flag allows not firing resize observer callbacks
     * when observation starts (avoids repositioning cascade). We
     * observe both the input and the container for repositioning. */
    state.inputObserver = listeners.addResizeObserver(field.element, () => reposition(false), { passive: true });
    state.containerObserver = listeners.addResizeObserver(state.container, () => reposition(false), { passive: true });

    sync();
    reposition(true);

    return { element: icon, sync, detach };
};

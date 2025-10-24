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
import { animatePositionChange } from '@proton/pass/utils/dom/position';
import { isInputElement } from '@proton/pass/utils/dom/predicates';
import { safeAsyncCall, safeCall } from '@proton/pass/utils/fp/safe-call';
import { waitUntil } from '@proton/pass/utils/fp/wait-until';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import noop from '@proton/utils/noop';

import type { IconStyles } from './icon.utils';
import {
    applyIconInjectionStyles,
    cleanupInjectionStyles,
    computeIconInjectionStyles,
    createIcon,
    hasIconInjectionStylesChanged,
} from './icon.utils';

type IconControllerOptions = {
    field: FieldHandle;
    /** `protonpass-control` custom element tag name */
    tag: string;
    onClick: () => void;
    onDetach: () => void;
};

export interface IconController {
    element: HTMLElement;
    detach: () => void;
    reposition: (reflow: boolean) => void;
    sync: () => void;
}

export type IconState = {
    ready: boolean;
    ctrl: MaybeNull<AbortController>;
    styles: MaybeNull<IconStyles>;
};

export const createIconController = (options: IconControllerOptions): MaybeNull<IconController> => {
    const { field, tag } = options;
    const input = field.element;
    const zIndex = field.getFormHandle().zIndex;

    if (!isInputElement(input)) return null;

    const state: IconState = { ready: false, ctrl: null, styles: null };

    const parent = (() => {
        /** TBD: instead of injecting the icon next to the anchor (either the input element
         * or the resolved bounding element), prefer injecting in nearest detected form.
         * Fallsback to document.body as a precaution. This should preserve z-index layering
         * while avoiding interferences in websites sensitive to the DOM structure of their
         * input fields (eg: some websites expect their input elements to always be the first
         * child of a wrapper component - interfering with this could cause unintented crashes) */
        const root = field.element.getRootNode();
        if (root instanceof ShadowRoot) return root;
        return field.getFormHandle().scrollChild;
    })();

    const anchor = field.getAnchor({ reflow: false });
    const { icon, control } = createIcon({ parent, zIndex, tag });
    const listeners = createListenerStore();

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
                        if (ctrl.signal.aborted) return;

                        if (dx > 0) {
                            const delta = Math.abs(dx - styles.icon.overlay.dx);
                            styles.icon.right += delta + styles.icon.overlay.pr;
                        }
                    }
                )
                .catch(noop);
        })
    );

    const reposition = withContext<(reflow?: boolean) => void>((ctx, reflow = false) => {
        state.ctrl?.abort();
        if (!ctx) return;

        const anchor = field.getAnchor({ reflow });
        const ctrl = new AbortController();
        state.ctrl = ctrl;

        let raf = requestAnimationFrame(async () => {
            /** Wait for anchor animations to complete before repositioning
             * FIXME: at this point we could check the parent frame for any
             * overlaying elements at the icon position */
            await waitUntil(() => !anchor.animating, 25, 1_000).catch(() => noop);

            if (ctrl.signal.aborted) return;

            const refs = { icon, control, input, anchor: anchor.element, parent };

            animatePositionChange({
                onAnimate: (request) => (raf = request),
                onComplete: async () => {
                    cleanupInjectionStyles(refs);
                    const styles = computeIconInjectionStyles(refs);
                    if (!ctx.mainFrame) await checkParentCollision(styles, ctrl);
                    if (ctrl.signal.aborted) return;

                    /** Only apply if there's a non-negliable change */
                    if (hasIconInjectionStylesChanged(state.styles, styles)) {
                        applyIconInjectionStyles(refs, styles);
                        state.styles = styles;
                    }

                    state.ready = true;
                    icon.classList.add('visible');
                },
                get: () => input.getBoundingClientRect(),
            });
        });

        ctrl.signal.addEventListener('abort', () => cancelAnimationFrame(raf));
    });

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
        state.ctrl?.abort();
        state.ctrl = null;
        state.ready = false;
        state.styles = null;

        options.onDetach();

        field.getAnchor().disconnect();
        field.setIcon(null);

        icon.remove();
        control.remove();

        listeners.removeAll();
        cleanupInjectionStyles({ input, control });
    });

    /** Icon repositioning triggers:
     * - window resize events
     * - form container resize (handled by FormHandles)
     * - DOM changes in field container (error messages, tooltips, other icons) */
    const target = anchor.element === input ? input.parentElement! : anchor.element;

    /** Uses pointer capture to prevent unintended clicks during icon repositioning.
     * Captures on pointerdown, releases on pointerup to handle repositioning mid-interaction. */
    listeners.addListener(icon, 'pointerdown', onPointerDown);
    listeners.addListener(icon, 'pointerup', onPointerUp);
    listeners.addListener(window, 'resize', () => reposition(false));
    listeners.addResizeObserver(target, () => reposition(false));

    listeners.addObserver(
        target,
        () => {
            /** DOM mutations may affect field layout (error messages, tooltips, icons).
             * Revalidate anchor element positioning with reflow=true to ensure
             * icon remains correctly positioned relative to potentially changed boundaries. */
            reposition(true);
        },
        { childList: true, subtree: true }
    );

    /* fire reposition & sync on initial
     * icon handle creation */
    anchor.connect();
    sync();
    reposition(true);

    return { element: icon, sync, detach, reposition };
};

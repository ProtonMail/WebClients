import {
    ACTIVE_ICON_SRC,
    COUNTER_ICON_SRC,
    DISABLED_ICON_SRC,
    LOCKED_ICON_SRC,
} from 'proton-pass-extension/app/content/constants.runtime';
import { withContext } from 'proton-pass-extension/app/content/context/context';
import type { FieldHandle } from 'proton-pass-extension/app/content/services/form/field';

import { FieldType, FormType } from '@proton/pass/fathom/labels';
import { clientDisabled, clientLocked } from '@proton/pass/lib/client';
import type { AppStatus, MaybeNull } from '@proton/pass/types';
import { animatePositionChange } from '@proton/pass/utils/dom/position';
import { isInputElement } from '@proton/pass/utils/dom/predicates';
import { safeCall } from '@proton/pass/utils/fp/safe-call';
import { waitUntil } from '@proton/pass/utils/fp/wait-until';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import noop from '@proton/utils/noop';

import { applyInjectionStyles, cleanupInjectionStyles, createIcon } from './icon.utils';

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

export const createIconController = (options: IconControllerOptions): MaybeNull<IconController> => {
    const { field, tag } = options;
    const input = field.element;
    const zIndex = field.getFormHandle().zIndex;

    if (!isInputElement(input)) return null;

    let ready = false;

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

    anchor.connect();

    const listeners = createListenerStore();
    const repositioning = { request: -1, animate: -1 };

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

    /* `reposition` is debounced and wrapped in a `requestAnimationFrame`
     * for performance reasons. If form is detached, we must cancel the
     * ongoing repositioning */
    const cancelReposition = () => {
        cancelAnimationFrame(repositioning.request);
        cancelAnimationFrame(repositioning.animate);
    };

    const reposition = (reflow: boolean = false) => {
        cancelReposition();

        const anchor = field.getAnchor({ reflow });

        repositioning.request = requestAnimationFrame(async () => {
            /* Wait for anchor animations to complete before repositioning */
            await waitUntil(() => !anchor.animating, 25, 1_000).catch(() => noop);

            if (!ready) {
                ready = true;
                icon.classList.add('visible');
            }

            animatePositionChange({
                onAnimate: (request) => (repositioning.animate = request),
                get: () => input.getBoundingClientRect(),
                set: () => {
                    cleanupInjectionStyles({ input, control });
                    applyInjectionStyles({ icon, control, input, anchor: anchor.element, parent });
                },
            });
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
        ready = false;
        options.onDetach();

        field.getAnchor().disconnect();
        field.setIcon(null);

        icon.remove();
        control.remove();

        listeners.removeAll();
        cancelReposition();
        cleanupInjectionStyles({ input, control });
    });

    /* repositioning the icon can happen either :
     * · on window resize
     * · on form resize (handled in `FormHandles`)
     * · on new elements added to the field box (ie: icons) */
    const target = anchor.element === input ? input.parentElement! : anchor.element;

    /** Pointer capturing events are preferred to handle cases where icon
     * repositioning during interaction could generate unintended clicks */
    listeners.addListener(icon, 'pointerdown', onPointerDown);
    listeners.addListener(icon, 'pointerup', onPointerUp);
    listeners.addListener(window, 'resize', () => reposition(false));
    listeners.addResizeObserver(target, () => reposition(false));

    listeners.addObserver(
        target,
        () => {
            /* if the subtree changes we may be dealing with error messages,
             * tooltips or even icon indicators appearing : in this case we
             * should revalidate the input field's bounding box as it we may
             * have resolved an element which is no longer a correct fit for
             * injection */
            reposition(true);
        },
        { childList: true, subtree: true }
    );

    /* fire reposition & sync on initial
     * icon handle creation */
    sync();
    reposition(true);

    return { element: icon, sync, detach, reposition };
};

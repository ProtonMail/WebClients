import {
    ACTIVE_ICON_SRC,
    COUNTER_ICON_SRC,
    DISABLED_ICON_SRC,
    LOCKED_ICON_SRC,
} from 'proton-pass-extension/app/content/constants.runtime';
import {
    applyInjectionStyles,
    cleanupInjectionStyles,
    createIcon,
} from 'proton-pass-extension/app/content/injections/icon/utils';

import { clientDisabled, clientLocked } from '@proton/pass/lib/client';
import type { AppStatus } from '@proton/pass/types';
import { animatePositionChange } from '@proton/pass/utils/dom/position';
import { safeCall } from '@proton/pass/utils/fp/safe-call';
import { createListenerStore } from '@proton/pass/utils/listener/factory';

type IconControllerOptions = {
    input: HTMLInputElement;
    /** parent form element */
    form: HTMLElement;
    /** `protonpass-control` custom element tag name */
    tag: string;
    /** z-index for the control element */
    zIndex: number;

    getAnchor: (options: { reflow: boolean }) => HTMLElement;
    onClick: () => void;
};

export interface IconController {
    element: HTMLElement;
    detach: () => void;
    reposition: (reflow: boolean) => void;
    setCount: (count: number) => void;
    setStatus: (status: AppStatus) => void;
}

export const createIconController = (options: IconControllerOptions): IconController => {
    const { input, form, zIndex, tag } = options;

    const anchor = options.getAnchor({ reflow: false });
    const { icon, control } = createIcon({ anchor, zIndex, tag });

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

    /* `reposition` is debounced and wrapped in a `requestAnimationFrame`
     * for performance reasons. If form is detached, we must cancel the
     * ongoing repositioning */
    const cancelReposition = () => {
        cancelAnimationFrame(repositioning.request);
        cancelAnimationFrame(repositioning.animate);
    };

    const reposition = (reflow: boolean = false) => {
        cancelReposition();
        const anchor = options.getAnchor({ reflow });

        repositioning.request = requestAnimationFrame(() => {
            animatePositionChange({
                onAnimate: (request) => (repositioning.animate = request),
                get: () => options.input.getBoundingClientRect(),
                set: () => {
                    cleanupInjectionStyles({ input, control });
                    applyInjectionStyles({ icon, control, input, anchor, form });
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
        listeners.removeAll();
        cancelReposition();
        cleanupInjectionStyles({ input, control });
        icon.remove();
        control.remove();
    });

    /* repositioning the icon can happen either :
     * · on window resize
     * · on form resize (handled in `FormHandles`)
     * · on new elements added to the field box (ie: icons) */
    const target = anchor === input ? input.parentElement! : anchor;

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

    reposition(true); /* fire reposition on initial icon handle creation */

    return { element: icon, setStatus, setCount, detach, reposition };
};

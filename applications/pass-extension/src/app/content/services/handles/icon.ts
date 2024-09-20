import {
    ACTIVE_ICON_SRC,
    COUNTER_ICON_SRC,
    DISABLED_ICON_SRC,
    LOCKED_ICON_SRC,
} from 'proton-pass-extension/app/content/constants.runtime';
import { withContext } from 'proton-pass-extension/app/content/context/context';
import {
    applyInjectionStyles,
    cleanupInjectionStyles,
    createIcon,
} from 'proton-pass-extension/app/content/injections/icon';
import type { FieldHandle, FieldIconHandle } from 'proton-pass-extension/app/content/types';

import { clientDisabled, clientLocked } from '@proton/pass/lib/client';
import type { AppStatus } from '@proton/pass/types';
import type { PassElementsConfig } from '@proton/pass/types/utils/dom';
import { animatePositionChange } from '@proton/pass/utils/dom/position';
import { safeCall } from '@proton/pass/utils/fp/safe-call';
import { createListenerStore } from '@proton/pass/utils/listener/factory';

type CreateIconOptions = { field: FieldHandle; elements: PassElementsConfig };

export const createFieldIconHandle = ({ field, elements }: CreateIconOptions): FieldIconHandle => {
    const listeners = createListenerStore();
    const repositioning = { request: -1, animate: -1 };

    const input = field.element as HTMLInputElement;
    const { icon, control } = createIcon(field, elements.control);

    const setStatus = (status: AppStatus) => {
        const iconUrl = (() => {
            if (clientLocked(status)) return LOCKED_ICON_SRC;
            if (clientDisabled(status)) return DISABLED_ICON_SRC;
            return ACTIVE_ICON_SRC;
        })();

        icon.style.setProperty('background-image', `url("${iconUrl}")`, 'important');
    };

    const setCount = withContext<(count: number) => void>((ctx, count: number) => {
        if (!ctx) return;

        const safeCount = count === 0 || !count ? '' : String(count);
        icon.style.setProperty(`--control-count`, `"${safeCount}"`);

        if (count > 0) return icon.style.setProperty('background-image', `url("${COUNTER_ICON_SRC}")`, 'important');
        setStatus(ctx?.getState().status);
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
        const inputBox = field.getBoxElement({ reflow });
        const form = field.getFormHandle().element;

        repositioning.request = requestAnimationFrame(() => {
            animatePositionChange({
                onAnimate: (request) => (repositioning.animate = request),
                get: () => field.element.getBoundingClientRect(),
                set: () => {
                    cleanupInjectionStyles({ input, control });
                    applyInjectionStyles({ icon, control, input, inputBox, form });
                },
            });
        });
    };

    const onClick: (evt: MouseEvent) => void = withContext((ctx, evt) => {
        evt.preventDefault();
        evt.stopPropagation();

        const { action } = field;
        const dropdown = ctx?.service.iframe.dropdown;
        const visible = dropdown?.getState().visible;

        if (action) return visible ? dropdown?.close() : dropdown?.open({ action: action.type, field });
    });

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
    const target = field.element === field.boxElement ? field.element.parentElement! : field.boxElement;

    listeners.addListener(icon, 'mousedown', onClick);
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

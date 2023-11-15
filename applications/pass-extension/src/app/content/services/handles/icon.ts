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

import { clientErrored, clientLocked, clientStale, clientUnauthorized } from '@proton/pass/lib/client';
import type { AppStatus } from '@proton/pass/types';
import { animatePositionChange } from '@proton/pass/utils/dom/position';
import { or } from '@proton/pass/utils/fp/predicates';
import { safeCall } from '@proton/pass/utils/fp/safe-call';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import debounce from '@proton/utils/debounce';

type CreateIconOptions = { field: FieldHandle };

export const createFieldIconHandle = ({ field }: CreateIconOptions): FieldIconHandle => {
    const listeners = createListenerStore();
    let repositionRequest: number = -1; /* track repositioning requests */

    const input = field.element as HTMLInputElement;
    const { icon, control } = createIcon(field);

    const setStatus = (status: AppStatus) => {
        const iconUrl = (() => {
            if (clientLocked(status)) return LOCKED_ICON_SRC;
            if (or(clientUnauthorized, clientErrored, clientStale)(status)) return DISABLED_ICON_SRC;
            return ACTIVE_ICON_SRC;
        })();

        icon.style.setProperty('background-image', `url("${iconUrl}")`, 'important');
    };

    const setCount = withContext<(count: number) => void>(({ getState }, count: number) => {
        const safeCount = count === 0 || !count ? '' : String(count);
        icon.style.setProperty(`--control-count`, `"${safeCount}"`);

        if (count > 0) return icon.style.setProperty('background-image', `url("${COUNTER_ICON_SRC}")`, 'important');
        return setStatus(getState().status);
    });

    const reposition = debounce(
        (revalidate: boolean = false) => {
            cancelAnimationFrame(repositionRequest);
            repositionRequest = requestAnimationFrame(() => {
                animatePositionChange({
                    get: () => field.element.getBoundingClientRect(),
                    set: () => {
                        const inputBox = field.getBoxElement({ revalidate });
                        cleanupInjectionStyles({ input, control });
                        applyInjectionStyles({
                            icon,
                            control,
                            input,
                            inputBox,
                            form: field.getFormHandle().element,
                        });
                    },
                });
            });
        },
        50,
        { leading: true, trailing: true }
    );

    /* `reposition` is debounced and wrapped in a `requestAnimationFrame`
     * for performance reasons. If form is detached, we must cancel the
     * ongoing repositioning */
    const cancelReposition = () => {
        cancelAnimationFrame(repositionRequest);
        reposition.cancel();
    };

    const onClick: (evt: MouseEvent) => void = withContext(({ service: { iframe } }, evt) => {
        evt.preventDefault();
        evt.stopPropagation();

        if (field.action) {
            return iframe.dropdown?.getState().visible
                ? iframe.dropdown?.close()
                : iframe.dropdown?.open({ action: field.action, field });
        }
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
            reposition.cancel();
            reposition(true);
        },
        { childList: true, subtree: true }
    );

    reposition(); /* fire reposition on initial icon handle creation */

    return { element: icon, setStatus, setCount, detach, reposition };
};

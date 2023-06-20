import { WorkerStatus } from '@proton/pass/types';
import { safeCall } from '@proton/pass/utils/fp';
import { createListenerStore } from '@proton/pass/utils/listener';
import debounce from '@proton/utils/debounce';

import { ACTIVE_ICON_SRC, DISABLED_ICON_SRC, EXTENSION_PREFIX, ICON_CLASSNAME, LOCKED_ICON_SRC } from '../../constants';
import { withContext } from '../../context/context';
import { applyInjectionStyles, cleanupInjectionStyles, createIcon } from '../../injections/icon';
import type { FieldHandle, FieldIconHandle } from '../../types';

type CreateIconOptions = { field: FieldHandle };

export const createFieldIconHandle = ({ field }: CreateIconOptions): FieldIconHandle => {
    const listeners = createListenerStore();
    let repositionRequest: number = -1; /* track repositioning requests */

    const input = field.element as HTMLInputElement;
    const { icon, wrapper } = createIcon(field);

    const setStatus = (status: WorkerStatus) => {
        icon.classList.remove(`${ICON_CLASSNAME}--loading`);

        switch (status) {
            case WorkerStatus.READY:
                return icon.style.setProperty('background-image', `url("${ACTIVE_ICON_SRC}")`, 'important');

            case WorkerStatus.LOCKED:
                return icon.style.setProperty('background-image', `url("${LOCKED_ICON_SRC}")`, 'important');

            default:
                return icon.style.setProperty('background-image', `url("${DISABLED_ICON_SRC}")`, 'important');
        }
    };

    const setCount = (count: number) => {
        const safeCount = count === 0 || !count ? '' : String(count);
        icon.style.setProperty(`--${EXTENSION_PREFIX}-items-count`, `"${safeCount}"`);
    };

    const reposition = debounce(
        (revalidate: boolean = false) => {
            cancelAnimationFrame(repositionRequest);
            repositionRequest = requestAnimationFrame(() => {
                cleanupInjectionStyles({ input, wrapper });
                applyInjectionStyles({ input, wrapper, inputBox: field.getBoxElement({ revalidate }), icon });
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
        field.element.focus();

        if (field.action) {
            return iframe.dropdown?.getState().visible
                ? iframe.dropdown?.close()
                : iframe.dropdown?.open({ action: field.action, field });
        }
    });

    const detach = safeCall(() => {
        listeners.removeAll();
        cancelReposition();
        cleanupInjectionStyles({ input, wrapper });
        icon.parentElement!.removeChild(icon);
        wrapper.parentElement!.removeChild(wrapper);
    });

    listeners.addListener(icon, 'mousedown', onClick);

    /* repositioning the icon can happen either :
     * · on window resize
     * · on form resize (handled in `FormHandles`)
     * · on new elements added to the field box (ie: icons) */
    const target = field.element === field.boxElement ? field.element.parentElement! : field.boxElement;

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

    return { element: icon, setStatus, setCount, detach, reposition };
};

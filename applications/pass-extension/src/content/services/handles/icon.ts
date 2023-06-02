import { WorkerStatus } from '@proton/pass/types';
import { safeCall } from '@proton/pass/utils/fp';
import { createListenerStore } from '@proton/pass/utils/listener';
import debounce from '@proton/utils/debounce';

import { EXTENSION_PREFIX, ICON_CLASSNAME } from '../../constants';
import { withContext } from '../../context/context';
import { applyInjectionStyles, cleanupInjectionStyles, createIcon } from '../../injections/icon';
import { createLockIcon } from '../../injections/icon/svg';
import type { FieldHandle, FieldIconHandle } from '../../types';

type CreateIconOptions = { field: FieldHandle };

export const createFieldIconHandle = ({ field }: CreateIconOptions): FieldIconHandle => {
    const listeners = createListenerStore();
    let repositionRequest: number = -1; /* track repositioning requests */

    const input = field.element as HTMLInputElement;
    const { icon, wrapper } = createIcon(field);
    const lock = createLockIcon();

    const setStatus = (status: WorkerStatus) => {
        icon.classList.remove(`${ICON_CLASSNAME}--loading`);
        safeCall(() => icon.removeChild(lock))();

        switch (status) {
            case WorkerStatus.READY:
                return icon.classList.remove(`${ICON_CLASSNAME}--disabled`);

            case WorkerStatus.LOCKED:
                icon.classList.add(`${ICON_CLASSNAME}--disabled`);
                return icon.appendChild(lock);

            default:
                return icon.classList.add(`${ICON_CLASSNAME}--disabled`);
        }
    };

    const setCount = (count: number) => {
        const safeCount = count === 0 || !count ? '' : String(count);
        icon.style.setProperty(`--${EXTENSION_PREFIX}-items-count`, `"${safeCount}"`);
    };

    const reposition = debounce(
        () => {
            cancelAnimationFrame(repositionRequest);
            repositionRequest = requestAnimationFrame(() => {
                cleanupInjectionStyles({ input, wrapper });
                applyInjectionStyles({ input, wrapper, inputBox: field.getBoxElement(), icon });
            });
        },
        50,
        { leading: true }
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
     * - on window resize
     * - on form resize (handled in `FormTracker`)
     * - on new elements added to the field box (ie: icons) */
    listeners.addListener(window, 'resize', reposition);
    listeners.addObserver(field.boxElement, reposition, { childList: true });

    return { element: icon, setStatus, setCount, detach, reposition };
};

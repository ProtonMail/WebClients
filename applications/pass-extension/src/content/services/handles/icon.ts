import { WorkerStatus } from '@proton/pass/types';
import { safeCall } from '@proton/pass/utils/fp';
import { createListenerStore } from '@proton/pass/utils/listener';

import { EXTENSION_PREFIX, ICON_CLASSNAME } from '../../constants';
import { withContext } from '../../context/context';
import { applyInjectionStyles, cleanupInjectionStyles, createIcon } from '../../injections/icon';
import { createLockIcon } from '../../injections/icon/svg';
import type { FieldHandle, FieldIconHandle } from '../../types';

type CreateIconOptions = { field: FieldHandle };

export const createFieldIconHandle = ({ field }: CreateIconOptions): FieldIconHandle => {
    const listeners = createListenerStore();

    const input = field.element as HTMLInputElement;
    const inputBox = field.boxElement;
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

    const onResize = () => {
        cleanupInjectionStyles({ input, wrapper });
        applyInjectionStyles({ input, wrapper, inputBox, icon });
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

    const detach = () => {
        listeners.removeAll();
        cleanupInjectionStyles({ input, wrapper });
        icon.parentElement?.remove();
    };

    listeners.addListener(window, 'resize', onResize);
    listeners.addListener(icon, 'mousedown', onClick);

    return { element: icon, setStatus, setCount, detach };
};

import { WorkerStatus } from '@proton/pass/types';
import { safeCall } from '@proton/pass/utils/fp';
import { createListenerStore } from '@proton/pass/utils/listener';

import { EXTENSION_PREFIX, ICON_CLASSNAME } from '../../constants';
import { withContext } from '../../context/context';
import { applyInjectionStyles, cleanupInjectionStyles, createIcon } from '../../injections/icon';
import { createCircleLoader, createLockIcon } from '../../injections/icon/svg';
import { DropdownAction, type FieldHandle, type FieldIconHandle, type IconHandleState } from '../../types';

type CreateIconOptions = { field: FieldHandle };

export const createFieldIconHandle = ({ field }: CreateIconOptions): FieldIconHandle => {
    const state: IconHandleState = { timer: undefined, loading: false, action: null };
    const listeners = createListenerStore();

    const input = field.element as HTMLInputElement;
    const inputBox = field.boxElement;

    const { icon, wrapper } = createIcon(field);
    const loader = createCircleLoader();
    const lock = createLockIcon();

    const clickHandler = withContext(({ service: { iframe } }) => {
        if (state.action !== null) {
            return iframe.dropdown?.getState().visible
                ? iframe.dropdown?.close()
                : iframe.dropdown?.open({ action: state.action, field });
        }
    });

    const setStatus = (status: WorkerStatus) => {
        icon.classList.remove(`${ICON_CLASSNAME}--loading`);
        safeCall(() => icon.removeChild(loader))();
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

    const setAction = (action: DropdownAction) => {
        state.action = action;

        listeners.addListener(icon, 'click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            return !state.loading && clickHandler();
        });
    };

    const setCount = (count: number) => {
        const safeCount = count === 0 || !count ? '' : String(count);
        icon.style.setProperty(`--${EXTENSION_PREFIX}-items-count`, `"${safeCount}"`);
    };

    const setLoading = (loading: boolean) => {
        clearTimeout(state.timer);

        state.timer = setTimeout(
            () =>
                safeCall(() => {
                    icon.classList[loading ? 'add' : 'remove'](`${ICON_CLASSNAME}--loading`);
                    icon[loading ? 'appendChild' : 'removeChild'](loader);
                })(),
            50
        );

        state.loading = loading;
    };

    const handleResize = () => {
        cleanupInjectionStyles({ input, wrapper });
        applyInjectionStyles({ input, wrapper, inputBox, icon });
    };

    const detach = () => {
        listeners.removeAll();
        cleanupInjectionStyles({ input, wrapper });
        icon.parentElement?.remove();
    };

    listeners.addListener(window, 'resize', handleResize);

    return {
        element: icon,
        setStatus,
        setLoading,
        setCount,
        setAction,
        detach,
    };
};

import { Maybe, WorkerStatus } from '@proton/pass/types';
import { safeCall } from '@proton/pass/utils/fp';
import { createListenerStore } from '@proton/pass/utils/listener';

import { EXTENSION_PREFIX, ICON_CLASSNAME } from '../constants';
import CSContext from '../context';
import { applyInjectionStyles, cleanupInjectionStyles, createIcon } from '../injections/icon';
import { createCircleLoader, createLockIcon } from '../injections/icon/svg';
import { DropdownAction, FieldHandles, FieldIconHandles } from '../types';

type CreateIconOptions = { field: FieldHandles };
type IconHandlesContext = { timer: Maybe<NodeJS.Timeout>; loading: boolean };

const handleIconClick = (field: FieldHandles) => (action: DropdownAction) => {
    const dropdown = CSContext.get().iframes.dropdown;
    return dropdown.getState().visible ? dropdown.close() : dropdown.open({ action, field });
};

export const createFieldIconHandles = ({ field }: CreateIconOptions): FieldIconHandles => {
    const context = CSContext.get();
    const listeners = createListenerStore();
    const input = field.element as HTMLInputElement;
    const inputBox = field.boxElement;
    const { icon, wrapper } = createIcon(field);
    const loader = createCircleLoader();
    const lock = createLockIcon();

    const ctx: IconHandlesContext = { timer: undefined, loading: false };

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

    const setCount = (count: number) => {
        const safeCount = count === 0 || !count ? '' : String(count);
        icon.style.setProperty(`--${EXTENSION_PREFIX}-items-count`, `"${safeCount}"`);
    };

    const setLoading = (loading: boolean) => {
        clearTimeout(ctx.timer);

        ctx.timer = setTimeout(
            () =>
                safeCall(() => {
                    icon.classList[loading ? 'add' : 'remove'](`${ICON_CLASSNAME}--loading`);
                    icon[loading ? 'appendChild' : 'removeChild'](loader);
                })(),
            50
        );

        ctx.loading = loading;
    };

    const clickHandler = handleIconClick(field);

    const handleResize = () => {
        cleanupInjectionStyles({ input, wrapper });
        applyInjectionStyles({ input, wrapper, inputBox, icon });
    };

    listeners.addListener(window, 'resize', handleResize);
    setStatus(context.state.status);

    return {
        element: icon,
        setStatus,
        setLoading,
        setCount,
        setOnClickAction: (action) => {
            listeners.addListener(icon, 'click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                return !ctx.loading && clickHandler(action);
            });
        },
        detach: () => {
            listeners.removeAll();
            cleanupInjectionStyles({ input, wrapper });
            icon.parentElement?.remove();
        },
    };
};

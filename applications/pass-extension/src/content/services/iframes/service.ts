import type { MaybeNull } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp';
import { logger } from '@proton/pass/utils/logger';

import { withContext } from '../../context/context';
import type { IFrameAppService, InjectedDropdown, InjectedNotification } from '../../types';
import { createDropdown } from './dropdown';
import { createNotification } from './notification';

type IFrameServiceApps = {
    dropdown: MaybeNull<InjectedDropdown>;
    notification: MaybeNull<InjectedNotification>;
};

const onAttached: <T extends IFrameAppService<any>>(app: T) => void = withContext(
    ({ getExtensionContext, getState }, app) => {
        app.init(getExtensionContext().port);
        app.reset(getState());
    }
);

export const createIFrameService = () => {
    const apps: IFrameServiceApps = { dropdown: null, notification: null };

    const attachDropdown = () => {
        logger.info(`[ContentScript::IFrame] attaching dropdown iframe`);
        apps.dropdown = apps.dropdown ?? createDropdown();
        onAttached(apps.dropdown!);
    };

    const detachDropdown = () => {
        logger.info(`[ContentScript::IFrame] detaching dropdown iframe`);
        apps.dropdown?.destroy();
        apps.dropdown = null;
    };

    const attachNotification = () => {
        logger.info(`[ContentScript::IFrame] attaching notification iframe`);
        apps.notification = apps.notification ?? createNotification();
        onAttached(apps.notification!);
    };

    const detachNotification = () => {
        logger.info(`[ContentScript::IFrame] detaching notification iframe`);
        apps.notification?.destroy();
        apps.notification = null;
    };

    const reset = withContext(({ getState }) => {
        const state = getState();
        apps.dropdown?.reset(state);
        apps.notification?.reset(state);
    });

    const destroy = pipe(detachDropdown, detachNotification);

    return {
        get dropdown() {
            return apps.dropdown;
        },
        get notification() {
            return apps.notification;
        },
        attachDropdown,
        attachNotification,
        detachDropdown,
        detachNotification,
        reset,
        destroy,
    };
};

export type IFrameService = ReturnType<typeof createIFrameService>;

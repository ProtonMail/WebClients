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

    const attachDropdown = withContext(({ scriptId }) => {
        if (apps.dropdown === null) {
            logger.info(`[ContentScript::${scriptId}] attaching dropdown iframe`);
            apps.dropdown = createDropdown();
        }

        onAttached(apps.dropdown);
    });

    const detachDropdown = withContext(({ scriptId }) => {
        if (apps.dropdown) {
            logger.info(`[ContentScript::${scriptId}] detaching dropdown iframe`);
            apps.dropdown.destroy();
            apps.dropdown = null;
        }
    });

    const attachNotification = withContext(({ scriptId }) => {
        if (apps.notification === null) {
            logger.info(`[ContentScript::${scriptId}] attaching notification iframe`);
            apps.notification = apps.notification ?? createNotification();
        }

        onAttached(apps.notification);
    });

    const detachNotification = withContext(({ scriptId }) => {
        if (apps.notification) {
            logger.info(`[ContentScript::${scriptId}] detaching notification iframe`);
            apps.notification.destroy();
            apps.notification = null;
        }
    });

    const reset = () => {
        if (apps.dropdown) onAttached(apps.dropdown);
        if (apps.notification) onAttached(apps.notification);
    };

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

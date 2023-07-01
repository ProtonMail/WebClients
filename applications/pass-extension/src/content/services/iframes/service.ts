import type { MaybeNull } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';

import { withContext } from '../../context/context';
import type { IFrameAppService, InjectedDropdown, InjectedNotification } from '../../types';
import { createDropdown } from './dropdown';
import { createNotification } from './notification';

type IFrameServiceContext = {
    apps: {
        dropdown: MaybeNull<InjectedDropdown>;
        notification: MaybeNull<InjectedNotification>;
    };
};

export const createIFrameService = () => {
    const ctx: IFrameServiceContext = {
        apps: { dropdown: null, notification: null },
    };

    /* only re-init the iframe sub-apps if the extension
     * context port has changed */
    const onAttached: <T extends IFrameAppService<any>>(app: T) => void = withContext(
        ({ getExtensionContext, getState, getSettings }, app) => {
            const port = getExtensionContext().port;
            if (app.getState().port !== port) app.init(port);
            app.reset(getState(), getSettings());
        }
    );

    const attachDropdown = withContext(({ scriptId }) => {
        if (ctx.apps.dropdown === null) {
            logger.info(`[ContentScript::${scriptId}] attaching dropdown iframe`);
            ctx.apps.dropdown = createDropdown();
        }

        onAttached(ctx.apps.dropdown);
    });

    const detachDropdown = withContext(({ scriptId }) => {
        if (ctx.apps.dropdown) {
            logger.info(`[ContentScript::${scriptId}] detaching dropdown iframe`);
            ctx.apps.dropdown.destroy();
            ctx.apps.dropdown = null;
        }
    });

    const attachNotification = withContext(({ scriptId }) => {
        if (ctx.apps.notification === null) {
            logger.info(`[ContentScript::${scriptId}] attaching notification iframe`);
            ctx.apps.notification = createNotification();
        }

        onAttached(ctx.apps.notification);
    });

    const detachNotification = withContext(({ scriptId }) => {
        if (ctx.apps.notification) {
            logger.info(`[ContentScript::${scriptId}] detaching notification iframe`);
            ctx.apps.notification.destroy();
            ctx.apps.notification = null;
        }
    });

    const reset = () => {
        if (ctx.apps.dropdown) onAttached(ctx.apps.dropdown);
        if (ctx.apps.notification) onAttached(ctx.apps.notification);
    };

    const destroy = () => {
        detachDropdown();
        detachNotification();
    };

    return {
        get dropdown() {
            return ctx.apps.dropdown;
        },
        get notification() {
            return ctx.apps.notification;
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

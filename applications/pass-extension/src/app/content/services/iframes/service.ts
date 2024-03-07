import type { MaybeNull } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';

import { withContext } from '../../context/context';
import { isIFrameRootAttached } from '../../injections/iframe/create-iframe-root';
import type { IFrameAppService, InjectedDropdown, InjectedNotification } from '../../types';
import { createDropdown } from './dropdown';
import { createNotification } from './notification';

type IFrameServiceState = {
    apps: {
        dropdown: MaybeNull<InjectedDropdown>;
        notification: MaybeNull<InjectedNotification>;
    };
};

export const createIFrameService = () => {
    const state: IFrameServiceState = {
        apps: {
            dropdown: null,
            notification: null,
        },
    };

    /* only re-init the iframe sub-apps if the extension
     * context port has changed */
    const onAttached: <T extends IFrameAppService<any>>(app: T) => void = withContext((ctx, app) => {
        if (!ctx) return;

        const port = ctx.getExtensionContext().port;
        if (app.getState().port !== port) app.setPort(port);

        app.init({
            features: ctx.getFeatureFlags(),
            settings: ctx.getSettings(),
            workerState: ctx.getState(),
        });
    });

    const attachDropdown = withContext((ctx) => {
        if (!ctx) return;

        if (state.apps.dropdown === null) {
            logger.info(`[ContentScript::${ctx.scriptId}] attaching dropdown iframe`);
            state.apps.dropdown = createDropdown(ctx.elements);
        }

        onAttached(state.apps.dropdown);
    });

    const detachDropdown = () => {
        state.apps.dropdown?.destroy();
        state.apps.dropdown = null;
    };

    const attachNotification = withContext((ctx) => {
        if (!ctx) return;

        const iframeRootAttached = isIFrameRootAttached(ctx.elements.root);

        if (state.apps.notification === null || !iframeRootAttached) {
            if (!iframeRootAttached) detachDropdown();
            logger.info(`[ContentScript::${ctx.scriptId}] attaching notification iframe`);
            state.apps.notification = createNotification(ctx.elements);
        }

        onAttached(state.apps.notification);
    });

    const detachNotification = () => {
        state.apps.notification?.destroy();
        state.apps.notification = null;
    };

    const reset = () => {
        if (state.apps.dropdown) onAttached(state.apps.dropdown);
        if (state.apps.notification) onAttached(state.apps.notification);
    };

    const destroy = () => {
        detachDropdown();
        detachNotification();
    };

    return {
        get dropdown() {
            return state.apps.dropdown;
        },
        get notification() {
            return state.apps.notification;
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

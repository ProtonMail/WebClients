import { Runtime } from 'webextension-polyfill';

import type { MaybeNull } from '@proton/pass/types';

import { withContext } from '../../context/context';
import { isIFrameRootAttached } from '../../injections/iframe/create-iframe-root';
import type { InjectedDropdown, InjectedNotification } from '../../types';
import { createDropdown } from './dropdown';
import { createNotification } from './notification';

type IFrameServiceApps = {
    dropdown: MaybeNull<InjectedDropdown>;
    notification: MaybeNull<InjectedNotification>;
};

export const createIFrameService = () => {
    const apps: IFrameServiceApps = { dropdown: null, notification: null };

    const destroy = () => {
        apps.dropdown?.destroy();
        apps.dropdown = null;

        apps.notification?.destroy();
        apps.notification = null;
    };

    const reset = withContext(({ getState }) => {
        const state = getState();
        apps.dropdown?.reset(state);
        apps.notification?.reset(state);
    });

    /* Some SPA websites might wipe the whole DOM on page change :
     * this will cause our IFrame root to be removed. If this is the
     * case we must re-init the injected frames with the current port
     * and the current worker state */
    const attach = (port: Runtime.Port) => {
        if (!isIFrameRootAttached()) {
            destroy();
            apps.dropdown = createDropdown();
            apps.notification = createNotification();
            reset();
        }

        apps.dropdown?.init(port);
        apps.notification?.init(port);
    };

    return { attach, destroy, reset, apps };
};

export type IFrameService = ReturnType<typeof createIFrameService>;

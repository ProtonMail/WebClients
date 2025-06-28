import type { PropsWithChildren } from 'react';
import { type FC, createContext, useCallback, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

import type { IFrameAppController } from 'proton-pass-extension/app/content/injections/apps/components/IFrameAppController';
import { createIFrameAppController } from 'proton-pass-extension/app/content/injections/apps/components/IFrameAppController';
import { isIFrameMessage } from 'proton-pass-extension/app/content/injections/iframe/utils';
import type { IFrameMessageType, IFramePortMessageHandler } from 'proton-pass-extension/app/content/types';
import { IFramePortMessageType } from 'proton-pass-extension/app/content/types';
import locales from 'proton-pass-extension/app/locales';
import { useExtensionActivityProbe } from 'proton-pass-extension/lib/hooks/useExtensionActivityProbe';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import useInstance from '@proton/hooks/useInstance';
import { AppStateManager } from '@proton/pass/components/Core/AppStateManager';
import { useAuthStore } from '@proton/pass/components/Core/AuthStoreProvider';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { createUseContext } from '@proton/pass/hooks/useContextFactory';
import { type ProxiedSettings, getInitialSettings } from '@proton/pass/store/reducers/settings';
import type { MaybeNull } from '@proton/pass/types';
import { withMerge } from '@proton/pass/utils/object/merge';
import { setTtagLocales } from '@proton/shared/lib/i18n/locales';
import noop from '@proton/utils/noop';

export type IFrameAppState = {
    connectionID: MaybeNull<string>;
    domain: string;
    settings: ProxiedSettings;
    visible: boolean;
};

const getInitialIFrameAppState = (): IFrameAppState => ({
    connectionID: null,
    domain: '',
    settings: getInitialSettings(),
    visible: false,
});

export const IFrameAppStateContext = createContext<MaybeNull<IFrameAppState>>(null);
export const IFrameAppControllerContext = createContext<MaybeNull<IFrameAppController>>(null);

/* The IFrameContextProvider is responsible for opening a new
 * dedicated port with the service-worker and sending out port-
 * forwarding messages to the content-script's ports. We retrieve
 * the content-script's parent port name through postMessaging */
export const IFrameApp: FC<PropsWithChildren> = ({ children }) => {
    const { i18n, endpoint, theme } = usePassCore();
    if (!(endpoint === 'dropdown' || endpoint === 'notification')) throw Error('Invalid IFrame endpoint');

    const authStore = useAuthStore();
    const activityProbe = useExtensionActivityProbe();

    const [state, setIFrameAppState] = useState<IFrameAppState>(getInitialIFrameAppState);

    const setState = useCallback(
        (update: Partial<IFrameAppState>) => setIFrameAppState(withMerge<IFrameAppState>(update)),
        []
    );

    const controller = useInstance(() =>
        createIFrameAppController(endpoint, (message: unknown) => {
            if (isIFrameMessage(message)) {
                switch (message?.type) {
                    case IFramePortMessageType.IFRAME_INIT:
                        AppStateManager.setState(message.payload.appState);
                        theme.setState(message.payload.theme);
                        setState({ settings: message.payload.settings, domain: message.payload.domain });
                        /** immediately set the locale on iframe init : the `IFramContextProvider`
                         * does not use the standard `ExtensionApp` wrapper which takes care of
                         * hydrating the initial locale and watching for language changes */
                        i18n.setLocale(message.payload.settings.locale).catch(noop);
                        return;
                    case IFramePortMessageType.IFRAME_HIDDEN:
                        /** Flush state update to force auto-sizer to pick up
                         * the visiblity change. Fixes firefox glitch where
                         * visibility changes are batched. */
                        return flushSync(() => setState({ visible: false }));
                    case IFramePortMessageType.IFRAME_OPEN:
                        return flushSync(() => setState({ visible: true }));
                    case IFramePortMessageType.IFRAME_THEME:
                        return theme.setState(message.payload);
                    case WorkerMessageType.SETTINGS_UPDATE:
                        return setState({ settings: message.payload });
                    case WorkerMessageType.LOCALE_UPDATED:
                        return i18n.setLocale(message.payload.locale).catch(noop);
                    /* If for any reason we get a `PORT_UNAUTHORIZED`
                     * message : it likely means the iframe was injected
                     * without being controlled by a content-script either
                     * accidentally or intentionnally. Just to be safe, clear
                     * the frame's innerHTML */
                    case WorkerMessageType.PORT_UNAUTHORIZED:
                        return controller.disconnect();
                    case WorkerMessageType.WORKER_STATE_CHANGE:
                        authStore?.setLocalID(message.payload.state.localID);
                        return AppStateManager.setState(message.payload.state);
                }
            }
        })
    );

    useEffect(() => {
        setTtagLocales(locales);
        controller.subscribe((port) => setState({ connectionID: port.name }));
        return controller.init();
    }, []);

    useEffect(() => {
        if (state.visible) activityProbe.start();
        else activityProbe.cancel();
    }, [state.visible]);

    return (
        <IFrameAppControllerContext.Provider value={controller}>
            <IFrameAppStateContext.Provider value={state}>{children}</IFrameAppStateContext.Provider>
        </IFrameAppControllerContext.Provider>
    );
};

export const useIFrameAppState = createUseContext(IFrameAppStateContext);
export const useIFrameAppController = createUseContext(IFrameAppControllerContext);

export const useRegisterMessageHandler = <M extends IFrameMessageType>(
    type: M,
    handler: IFramePortMessageHandler<M>
) => {
    const controller = useIFrameAppController();
    useEffect(() => controller.registerHandler(type, handler), [type, handler]);
};

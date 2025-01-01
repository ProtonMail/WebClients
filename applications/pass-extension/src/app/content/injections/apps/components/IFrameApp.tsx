import type { PropsWithChildren } from 'react';
import { type FC, createContext, useCallback, useEffect, useState } from 'react';

import type { IFrameAppController } from 'proton-pass-extension/app/content/injections/apps/components/IFrameAppController';
import { createIFrameAppController } from 'proton-pass-extension/app/content/injections/apps/components/IFrameAppController';
import { isIFrameMessage } from 'proton-pass-extension/app/content/injections/iframe/utils';
import type { IFrameMessageType, IFramePortMessageHandler } from 'proton-pass-extension/app/content/types';
import { IFramePortMessageType } from 'proton-pass-extension/app/content/types';
import locales from 'proton-pass-extension/app/locales';
import { useExtensionActivityProbe } from 'proton-pass-extension/lib/hooks/useExtensionActivityProbe';

import useInstance from '@proton/hooks/useInstance';
import { AppStateManager } from '@proton/pass/components/Core/AppStateManager';
import { useAppState } from '@proton/pass/components/Core/AppStateProvider';
import { useAuthStore } from '@proton/pass/components/Core/AuthStoreProvider';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { createUseContext } from '@proton/pass/hooks/useContextFactory';
import { clientReady } from '@proton/pass/lib/client';
import { contentScriptMessage, sendMessage } from '@proton/pass/lib/extension/message/send-message';
import { type ProxiedSettings, getInitialSettings } from '@proton/pass/store/reducers/settings';
import type { MaybeNull } from '@proton/pass/types';
import { WorkerMessageType } from '@proton/pass/types';
import { withMerge } from '@proton/pass/utils/object/merge';
import { setTtagLocales } from '@proton/shared/lib/i18n/locales';
import noop from '@proton/utils/noop';

export type IFrameAppState = {
    connectionID: MaybeNull<string>;
    domain: string;
    settings: ProxiedSettings;
    userEmail: MaybeNull<string>;
    visible: boolean;
};

const getInitialIFrameAppState = (): IFrameAppState => ({
    connectionID: null,
    domain: '',
    settings: getInitialSettings(),
    userEmail: null,
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

    const { status } = useAppState();
    const authStore = useAuthStore();
    const activityProbe = useExtensionActivityProbe();
    const controller = useInstance(() => createIFrameAppController(endpoint));

    const [state, setIFrameAppState] = useState<IFrameAppState>(getInitialIFrameAppState);

    const setState = useCallback(
        (update: Partial<IFrameAppState>) => setIFrameAppState(withMerge<IFrameAppState>(update)),
        []
    );

    useEffect(() => {
        if (state.userEmail === null && clientReady(status)) {
            sendMessage
                .onSuccess(
                    contentScriptMessage({ type: WorkerMessageType.RESOLVE_USER }),
                    (response) => response.user?.Email && setState({ userEmail: response.user.Email })
                )
                .catch(noop);
        }
    }, [status, state.userEmail]);

    useEffect(() => {
        setTtagLocales(locales);
        controller.subscribe((port) => setState({ connectionID: port.name }));
        return controller.init();
    }, []);

    useEffect(() => {
        const port = controller.getPort();

        return port?.onMessage.addListener((message: unknown) => {
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
                        return setState({ visible: false });
                    case IFramePortMessageType.IFRAME_OPEN:
                        return setState({ visible: true });
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
        });
    }, [state.connectionID]);

    useEffect(() => {
        if (state.visible && AppStateManager.getState().authorized) activityProbe.start();
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
    const state = useIFrameAppState();
    const controller = useIFrameAppController();
    useEffect(() => controller.registerHandler(type, handler), [type, handler, state.connectionID]);
};

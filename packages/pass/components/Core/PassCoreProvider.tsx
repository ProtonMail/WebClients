import type { FC, PropsWithChildren } from 'react';
import { useEffect, useState } from 'react';

import ConfigProvider from '@proton/components/containers/config/Provider';
import useInstance from '@proton/hooks/useInstance';
import { PassThemeProvider } from '@proton/pass/components/Layout/Theme/ThemeProvider';
import { preloadPassUI } from '@proton/pass/lib/core/ui.proxy';
import noop from '@proton/utils/noop';

import { AppStateProvider } from './AppStateProvider';
import { PassCoreContext, type PassCoreContextValue, type PassCoreProviderProps } from './PassCoreContext';

export type {
    ExtensionClientState,
    PassCoreContextValue,
    PassCoreProviderProps,
    PopupController,
} from './PassCoreContext';
export { PassCoreContext, useCurrentPort, useCurrentTabID, usePassCore } from './PassCoreContext';

/** The `PassCoreProvider` must be made available on all pass
 * clients : it provides implementations for processes that are
 * dependent on the platform. */
export const PassCoreProvider: FC<PropsWithChildren<PassCoreProviderProps>> = ({ children, wasm, bridge, ...core }) => {
    const [initialized, setInitialized] = useState(!wasm);
    const context = useInstance<PassCoreContextValue>(() => core);

    useEffect(() => {
        const client = ['desktop', 'web'].includes(core.endpoint) ? core.endpoint : 'extension';
        document.body.classList.add(`pass-${client}`);

        if (wasm) {
            preloadPassUI()
                ?.catch(noop)
                .finally(() => setInitialized(true));
        }
    }, []);

    return (
        <ConfigProvider config={core.config}>
            <PassCoreContext.Provider value={context}>
                <PassThemeProvider>
                    <AppStateProvider bridge={bridge}>{initialized && children}</AppStateProvider>
                </PassThemeProvider>
            </PassCoreContext.Provider>
        </ConfigProvider>
    );
};

import type { FC, ReactNode } from 'react';

import {
    IFrameAppControllerContext,
    type IFrameAppState,
    IFrameAppStateContext,
} from 'proton-pass-extension/lib/components/Inline/IFrameApp';
import type { IFrameAppController } from 'proton-pass-extension/lib/components/Inline/IFrameAppController';

import { AppStateContext } from '@proton/pass/components/Core/AppStateProvider';
import { getInitialSettings } from '@proton/pass/store/reducers/settings';
import { type AppState, AppStatus } from '@proton/pass/types';
import noop from '@proton/utils/noop';

const mockAppState = (appState?: Partial<AppState>) => ({
    booted: true,
    localID: undefined,
    authorized: true,
    status: AppStatus.READY,
    UID: undefined,
    ...appState,
});

const mockIFrameAppState = (domain?: string): IFrameAppState => ({
    domain: domain ?? 'proton.test',
    connectionID: 'test',
    settings: getInitialSettings(),
    visible: true,
});

const mockIFrameAppController = (): IFrameAppController => new Proxy({} as IFrameAppController, { get: () => noop });

export const MockIFrameApp: FC<{
    children: ReactNode;
    domain?: string;
    appState?: Partial<AppState>;
    height?: number;
    width: number;
}> = ({ children, domain, appState, height, width }) => (
    <div
        style={{
            width: '100%',
            height,
            maxWidth: width,
            overflow: 'hidden',
            boxShadow: '0 2px 10px rgb(0 0 0 / 0.3)',
            borderRadius: 12,
            marginBottom: 12,
        }}
    >
        <AppStateContext.Provider value={mockAppState(appState)}>
            <IFrameAppStateContext.Provider value={mockIFrameAppState(domain)}>
                <IFrameAppControllerContext.Provider value={mockIFrameAppController()}>
                    {children}
                </IFrameAppControllerContext.Provider>
            </IFrameAppStateContext.Provider>
        </AppStateContext.Provider>
    </div>
);

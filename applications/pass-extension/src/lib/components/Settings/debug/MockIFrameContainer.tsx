import type { FC, ReactNode } from 'react';

import {
    type IFrameAppState,
    IFrameAppStateContext,
} from 'proton-pass-extension/app/content/injections/apps/components/IFrameApp';
import { type DropdownActions, type NotificationActions } from 'proton-pass-extension/app/content/types';

import { AppStateContext } from '@proton/pass/components/Core/AppStateProvider';
import { getInitialSettings } from '@proton/pass/store/reducers/settings';
import { type AppState, AppStatus } from '@proton/pass/types';

const createMockIFrameContext = (payload?: any, domain?: string): IFrameAppState => ({
    domain: domain ?? 'proton.test',
    connectionID: 'test',
    settings: getInitialSettings(),
    userEmail: 'john@proton.me',
    visible: true,
});

export const MockIFrameContainer: FC<{
    children: ReactNode;
    domain?: string;
    appState?: Partial<AppState>;
    payload?: NotificationActions | DropdownActions;
    height?: number;
    width: number;
}> = ({ children, domain, appState, payload, height, width }) => (
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
        <AppStateContext.Provider
            value={{
                booted: true,
                localID: undefined,
                authorized: true,
                status: AppStatus.READY,
                UID: undefined,
                ...appState,
            }}
        >
            <IFrameAppStateContext.Provider value={createMockIFrameContext(payload, domain)}>
                {children}
            </IFrameAppStateContext.Provider>
        </AppStateContext.Provider>
    </div>
);

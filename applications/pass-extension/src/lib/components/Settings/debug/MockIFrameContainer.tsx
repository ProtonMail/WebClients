import type { FC, ReactNode } from 'react';

import {
    IFrameContext,
    type IFrameContextValue,
} from 'proton-pass-extension/app/content/injections/apps/components/IFrameApp';
import {
    type DropdownActions,
    IFramePortMessageType,
    type NotificationActions,
} from 'proton-pass-extension/app/content/types';

import { getInitialSettings } from '@proton/pass/store/reducers/settings';
import { type AppState, AppStatus } from '@proton/pass/types';
import noop from '@proton/utils/noop';

const createMockIFrameContext = (appState: Partial<AppState>, payload?: any): IFrameContextValue => ({
    endpoint: 'test',
    features: {},
    port: null,
    settings: getInitialSettings(),
    userEmail: 'john@proton.me',
    visible: true,
    appState: {
        booted: true,
        localID: undefined,
        loggedIn: true,
        status: AppStatus.READY,
        UID: undefined,
        ...appState,
    },
    close: noop,
    postMessage: noop,
    forwardMessage: noop,
    registerHandler: (action, cb) => {
        if (
            action === IFramePortMessageType.DROPDOWN_ACTION ||
            action === IFramePortMessageType.NOTIFICATION_ACTION ||
            payload
        ) {
            const timer = setTimeout(() => cb({ payload } as any), 50);
            return () => clearTimeout(timer);
        }

        return noop;
    },
    resize: noop,
});

export const MockIFrameContainer: FC<{
    children: ReactNode;
    appState?: Partial<AppState>;
    payload?: NotificationActions | DropdownActions;
    height?: number;
    width: number;
}> = ({ children, appState, payload, height, width }) => (
    <div
        style={{
            width: '100%',
            height,
            maxWidth: width,
            overflow: 'hidden',
            background: '#191927',
            boxShadow: '0 2px 10px rgb(0 0 0 / 0.3)',
            borderRadius: 12,
            marginBottom: 12,
        }}
    >
        <IFrameContext.Provider value={createMockIFrameContext(appState ?? {}, payload)}>
            {children}
        </IFrameContext.Provider>
    </div>
);

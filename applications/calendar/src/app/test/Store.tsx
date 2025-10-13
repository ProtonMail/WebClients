import type { PropsWithChildren } from 'react';

import type { createMemoryHistory } from 'history';

import { getModelState } from '@proton/account/test';
import { ProtonStoreProvider } from '@proton/redux-shared-store';
import type { CachedOrganizationKey, DecryptedKey, UserModel, UserSettings } from '@proton/shared/lib/interfaces';
import type { CalendarUserSettings } from '@proton/shared/lib/interfaces/calendar';
import { DEFAULT_MAIL_SETTINGS, DELAY_IN_SECONDS, PM_SIGNATURE } from '@proton/shared/lib/mail/mailSettings';
// eslint-disable-next-line import/no-extraneous-dependencies
import { apiMock } from '@proton/testing/lib/api';
// eslint-disable-next-line import/no-extraneous-dependencies
import { getOrganizationState, getSubscriptionState } from '@proton/testing/lib/initialReduxState';

import { extendStore, setupStore } from '../store/store';

export const getStoreWrapper = ({
    preloadedState,
    history,
}: {
    preloadedState?: Parameters<typeof setupStore>[0]['preloadedState'];
    history?: ReturnType<typeof createMemoryHistory>;
}) => {
    const store = setupStore({
        preloadedState: {
            user: getModelState({ UsedSpace: 10, MaxSpace: 100, Flags: {} } as UserModel),
            addresses: getModelState([]),
            addressKeys: {},
            userKeys: getModelState([{ publicKey: {}, privateKey: {} } as DecryptedKey]),
            userSettings: getModelState({ Flags: {}, Email: {}, Phone: {}, '2FA': {} } as UserSettings),
            mailSettings: getModelState({
                ...DEFAULT_MAIL_SETTINGS,
                PMSignature: PM_SIGNATURE.ENABLED,
                DelaySendSeconds: DELAY_IN_SECONDS.NONE,
            }),
            subscription: getSubscriptionState(),
            organization: getOrganizationState(),
            organizationKey: getModelState({} as CachedOrganizationKey),
            userInvitations: getModelState([]),
            contacts: getModelState([]),
            categories: getModelState([]),
            contactEmails: getModelState([]),
            calendars: getModelState([]),
            calendarUserSettings: getModelState({} as CalendarUserSettings),
            holidaysDirectory: getModelState([]),
            ...preloadedState,
        },
    });
    extendStore({
        authentication: {
            getPassword: () => '',
        } as any,
        api: apiMock as any,
        eventManager: jest.fn() as any,
        history,
    });

    function Wrapper({ children }: PropsWithChildren<{}>): JSX.Element {
        return <ProtonStoreProvider store={store}> {children} </ProtonStoreProvider>;
    }

    return { Wrapper, store };
};

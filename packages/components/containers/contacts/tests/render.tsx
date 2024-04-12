import { PropsWithChildren, ReactElement, ReactNode } from 'react';
import { Router } from 'react-router';

import { render as originalRender } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import { createMemoryHistory } from 'history';

import { getModelState } from '@proton/account/test';
import { CryptoApiInterface, VERIFICATION_STATUS } from '@proton/crypto';
import { ProtonStoreProvider } from '@proton/redux-shared-store';
import { APPS, CONTACT_CARD_TYPE } from '@proton/shared/lib/constants';
import { prepareVCardContact } from '@proton/shared/lib/contacts/encrypt';
import { parseToVCard } from '@proton/shared/lib/contacts/vcard';
import {
    ApiEnvironmentConfig,
    CachedOrganizationKey,
    OrganizationWithSettings,
    ProtonConfig,
} from '@proton/shared/lib/interfaces';
import { DecryptedKey, MailSettings, SubscriptionModel, UserModel, UserSettings } from '@proton/shared/lib/interfaces';
import { FREE_PLAN } from '@proton/shared/lib/subscription/freePlans';
import { apiMock } from '@proton/testing/lib/api';
import { mockCache } from '@proton/testing/lib/cache';

import ApiContext from '../../api/apiContext';
import AuthenticationProvider from '../../authentication/Provider';
import { CacheProvider } from '../../cache';
import { ConfigProvider } from '../../config';
import EventManagerContext from '../../eventManager/context';
import { NotificationsContext } from '../../notifications';
import ContactProvider from '../ContactProvider';
import { extendStore, setupStore } from './store';

export const mockedCryptoApi = {
    encryptMessage: jest.fn().mockImplementation(async ({ textData }) => ({
        signature: `mocked signature over ${textData}`,
        message: `${textData}`,
    })),
    decryptMessage: jest.fn().mockImplementation(async ({ armoredMessage }) => ({
        data: `${armoredMessage}`,
        verified: VERIFICATION_STATUS.SIGNED_AND_VALID,
    })),
    signMessage: jest
        .fn()
        .mockImplementation(async ({ textData }) => ({ signature: `mocked signature over ${textData}` })),
    verifyMessage: jest.fn().mockImplementation(async () => ({
        verified: VERIFICATION_STATUS.SIGNED_AND_VALID,
        signatureTimestamp: new Date(),
    })),
} as any as CryptoApiInterface;

window.ResizeObserver = jest.fn(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}));
// https://github.com/nickcolley/jest-axe/issues/147#issuecomment-758804533
const { getComputedStyle } = window;
window.getComputedStyle = (elt) => getComputedStyle(elt);

export const notificationManager = {
    createNotification: jest.fn(),
    removeNotification: jest.fn(),
    hideNotification: jest.fn(),
    removeDuplicate: jest.fn(),
    clearNotifications: jest.fn(),
    setOffset: jest.fn(),
};

export const config = {
    APP_NAME: APPS.PROTONMAIL,
    APP_VERSION: 'test-version',
    DATE_VERSION: 'test-date-version',
} as ProtonConfig;

export const eventManager = {
    start: jest.fn(),
    stop: jest.fn(),
    call: jest.fn(),
    subscribe: jest.fn(),
} as any;

extendStore({ api: apiMock as unknown as any, eventManager });

const TestProvider = ({ children }: { children: ReactNode }) => {
    const history = createMemoryHistory();
    return (
        <ConfigProvider config={config}>
            <ApiContext.Provider value={apiMock}>
                <CacheProvider cache={mockCache}>
                    <NotificationsContext.Provider value={notificationManager}>
                        <EventManagerContext.Provider value={eventManager}>
                            <AuthenticationProvider store={{} as any}>
                                <Router history={history}>
                                    <ContactProvider>{children}</ContactProvider>
                                </Router>
                            </AuthenticationProvider>
                        </EventManagerContext.Provider>
                    </NotificationsContext.Provider>
                </CacheProvider>
            </ApiContext.Provider>
        </ConfigProvider>
    );
};

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
    preloadedState?: Partial<Parameters<typeof setupStore>[0]['preloadedState']>;
}

export const getStoreWrapper = (preloadedState?: ExtendedRenderOptions['preloadedState']) => {
    const store = setupStore({
        preloadedState: {
            user: getModelState({} as UserModel),
            addresses: getModelState([]),
            addressKeys: {},
            contacts: getModelState([]),
            calendars: getModelState([]),
            categories: getModelState([]),
            contactEmails: getModelState([]),
            userKeys: getModelState([{ publicKey: {}, privateKey: {} } as DecryptedKey]),
            userSettings: getModelState({} as UserSettings),
            mailSettings: getModelState({} as MailSettings),
            subscription: getModelState({} as SubscriptionModel),
            organization: getModelState({} as OrganizationWithSettings),
            organizationKey: getModelState({} as CachedOrganizationKey),
            userInvitations: getModelState([]),
            plans: { ...getModelState({ plans: [], freePlan: FREE_PLAN }), meta: { fetchedAt: Date.now() } },
            features: {},
            importerConfig: getModelState({} as ApiEnvironmentConfig),
            ...preloadedState,
        },
    });

    function Wrapper({ children }: PropsWithChildren<{}>): JSX.Element {
        return (
            <ProtonStoreProvider store={store}>
                <TestProvider>{children}</TestProvider>
            </ProtonStoreProvider>
        );
    }

    return { Wrapper, store };
};

export function renderWithProviders(
    ui: ReactElement,
    { preloadedState, ...renderOptions }: ExtendedRenderOptions = {}
) {
    const { store, Wrapper } = getStoreWrapper(preloadedState);
    return { store, ...originalRender(ui, { wrapper: Wrapper, ...renderOptions, legacyRoot: true }) };
}

export const minimalCache = () => {};

export const clearAll = () => {
    jest.clearAllMocks();
    mockCache.clear();
};

export const prepareContact = async (vcard: string) => {
    const vCardContact = parseToVCard(vcard);
    const Cards = await prepareVCardContact(vCardContact, { privateKey: {} as any, publicKey: {} as any });
    return Cards;
};

export const getCard = (cards: any[], encrypted = false) => {
    return cards.find(
        ({ Type }: { Type: CONTACT_CARD_TYPE }) =>
            Type === (encrypted ? CONTACT_CARD_TYPE.ENCRYPTED_AND_SIGNED : CONTACT_CARD_TYPE.SIGNED)
    ).Data;
};

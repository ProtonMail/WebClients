import { ReactElement, ReactNode } from 'react';

import { RenderResult, render as originalRender } from '@testing-library/react';
import { resolvedRequest } from 'proton-mail/src/app/helpers/test/cache';

import { CryptoApiInterface, VERIFICATION_STATUS } from '@proton/crypto';
import { CONTACT_CARD_TYPE } from '@proton/shared/lib/constants';
import { prepareVCardContact } from '@proton/shared/lib/contacts/encrypt';
import { parseToVCard } from '@proton/shared/lib/contacts/vcard';
import createCache from '@proton/shared/lib/helpers/cache';
import { STATUS } from '@proton/shared/lib/models/cache';

import ApiContext from '../../api/apiContext';
import { CacheProvider } from '../../cache';
import EventManagerContext from '../../eventManager/context';
import FeaturesProvider from '../../features/FeaturesProvider';
import { NotificationsContext } from '../../notifications';
import ContactProvider from '../ContactProvider';

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

export const cache = createCache();
export const api = jest.fn();
export const notificationManager = {
    createNotification: jest.fn(),
    removeNotification: jest.fn(),
    hideNotification: jest.fn(),
    clearNotifications: jest.fn(),
    setOffset: jest.fn(),
};
export const eventManager = {
    start: jest.fn(),
    stop: jest.fn(),
    call: jest.fn(),
    subscribe: jest.fn(),
} as any;

const TestProvider = ({ children }: { children: ReactNode }) => (
    <ApiContext.Provider value={api}>
        <CacheProvider cache={cache}>
            <FeaturesProvider>
                <NotificationsContext.Provider value={notificationManager}>
                    <EventManagerContext.Provider value={eventManager}>
                        <ContactProvider>{children}</ContactProvider>
                    </EventManagerContext.Provider>
                </NotificationsContext.Provider>
            </FeaturesProvider>
        </CacheProvider>
    </ApiContext.Provider>
);

export const addToCache = (key: string, value: any) => {
    cache.set(key, resolvedRequest(value));
};

export const minimalCache = () => {
    cache.set('User', { status: STATUS.RESOLVED, value: {} });
    cache.set('MailSettings', { status: STATUS.RESOLVED, value: {} });
    cache.set('Addresses', { status: STATUS.RESOLVED, value: [] });
    cache.set('Labels', { status: STATUS.RESOLVED, value: [] });
    cache.set('Contacts', { status: STATUS.RESOLVED, value: [] });
    cache.set('ContactEmails', { status: STATUS.RESOLVED, value: [] });
    cache.set('USER_KEYS', {
        status: STATUS.RESOLVED,
        value: [{ publicKey: {}, privateKey: {} }],
    });
};

export const render = (ui: ReactElement, useMinimalCache = true): RenderResult => {
    if (useMinimalCache) {
        minimalCache();
    }

    const result = originalRender(<TestProvider>{ui}</TestProvider>);

    const rerender = async (ui: ReactElement) => {
        result.rerender(<TestProvider>{ui}</TestProvider>);
    };

    return { ...result, rerender };
};

export const clearAll = () => {
    jest.clearAllMocks();
    cache.clear();
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

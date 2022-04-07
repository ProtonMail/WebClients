import { ReactElement, ReactNode } from 'react';
import { STATUS } from '@proton/shared/lib/models/cache';
import createCache from '@proton/shared/lib/helpers/cache';
import { RenderResult, render as originalRender } from '@testing-library/react';
import { prepareVCardContact } from '@proton/shared/lib/contacts/encrypt';
import { parseToVCard } from '@proton/shared/lib/contacts/vcard';
import { CONTACT_CARD_TYPE } from '@proton/shared/lib/constants';
import { CacheProvider } from '../../cache';
import ApiContext from '../../api/apiContext';
import { NotificationsContext } from '../../notifications';
import EventManagerContext from '../../eventManager/context';
import ContactProvider from '../ContactProvider';

jest.mock('pmcrypto', () => {
    return {
        signMessage: async ({ data }: { data: any }) => {
            return { signature: data };
        },
        encryptMessage: async ({ data }: { data: any }) => {
            return { data, signature: data };
        },
        getSignature: async (signature: any) => signature,
        getMessage: async (message: any) => message,
        createCleartextMessage: (data: any) => data,
        verifyMessage: async () => {
            return { verified: 1, signatureTimestamp: new Date() };
        },
        decryptMessage: async ({ message }: { message: any }) => {
            return { data: message, verified: 1 };
        },
        VERIFICATION_STATUS: {
            NOT_SIGNED: 0,
            SIGNED_AND_VALID: 1,
            SIGNED_AND_INVALID: 2,
        },
    };
});

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
            <NotificationsContext.Provider value={notificationManager}>
                <EventManagerContext.Provider value={eventManager}>
                    <ContactProvider>{children}</ContactProvider>
                </EventManagerContext.Provider>
            </NotificationsContext.Provider>
        </CacheProvider>
    </ApiContext.Provider>
);

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

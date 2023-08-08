import { fromUnixTime, getUnixTime } from 'date-fns';

import { Message } from '@proton/shared/lib/interfaces/mail/Message';

import { renderHook } from 'proton-mail/helpers/test/render';
import { globalReset } from 'proton-mail/logic/actions';
import { MessageState } from 'proton-mail/logic/messages/messagesTypes';
import { initialize } from 'proton-mail/logic/messages/read/messagesReadActions';
import { store } from 'proton-mail/logic/store';
import { Conversation } from 'proton-mail/models/conversation';

import { useExpiringElement } from './useExpiringElement';

// TODO: Remove when global mock is merged (later)
class ResizeObserver {
    observe() {}

    unobserve() {}

    disconnect() {}
}

beforeAll(() => {
    window.ResizeObserver = ResizeObserver;
});

const MESSAGE_ID = 'messageID';

type GetStoreMessageProps = {
    types: ('withDraftFlagExpiresIn' | 'withDataExpirationTime')[];
    /** Unix timestamp */
    expirationTime: number;
    conversationID: string;
};
const getStoreMessage = ({ types, expirationTime, conversationID }: Partial<GetStoreMessageProps>) => {
    return {
        localID: MESSAGE_ID,
        data: {
            ...(conversationID ? { ConversationID: conversationID } : {}),
            ...(types?.includes('withDataExpirationTime') ? { ExpirationTime: expirationTime } : {}),
        },
        draftFlags: {
            ...(types?.includes('withDraftFlagExpiresIn') ? { expiresIn: fromUnixTime(expirationTime as number) } : {}),
        },
    } as MessageState;
};

describe('useExpiringElement', () => {
    let dateTimestamp: number;
    beforeEach(() => {
        dateTimestamp = getUnixTime(new Date(2023, 7, 27, 0, 0, 0, 0));
    });
    afterEach(() => {
        store.dispatch(globalReset());
    });

    describe('Conversation mode ON', () => {
        const conversationID = 'conversationID';
        const element = {
            ID: conversationID,
        } as Conversation;
        const labelID = '0';

        it('Should not have expiration when no `contextExpirationTime` on the Element and no `expiresIn` draftFlag in messages from store', async () => {
            store.dispatch(initialize(getStoreMessage({ conversationID })));
            const result = await renderHook(() => useExpiringElement(element, labelID, true));

            expect(result.result.current.hasExpiration).toBe(false);
            expect(result.result.current.expirationTime).toBe(0);
        });

        it('Should not have expiration with `expirationTime` data in messages from store', async () => {
            store.dispatch(
                initialize(
                    getStoreMessage({
                        conversationID,
                        types: ['withDataExpirationTime'],
                        expirationTime: dateTimestamp,
                    })
                )
            );
            const result = await renderHook(() => useExpiringElement(element, labelID, true));

            expect(result.result.current.hasExpiration).toBe(false);
            expect(result.result.current.expirationTime).toBe(0);
        });

        it('Should have expiration with `contextExpirationTime` on the element', async () => {
            const result = await renderHook(() =>
                useExpiringElement(
                    {
                        ...element,
                        ContextExpirationTime: dateTimestamp,
                    },
                    labelID,
                    true
                )
            );

            expect(result.result.current.hasExpiration).toBe(true);
            expect(result.result.current.expirationTime).toBe(dateTimestamp);
        });

        it('Should have expiration with `expiresIn` draftFlag in messages from store', async () => {
            store.dispatch(
                initialize(
                    getStoreMessage({
                        conversationID,
                        types: ['withDraftFlagExpiresIn'],
                        expirationTime: dateTimestamp,
                    })
                )
            );

            const result = await renderHook(() => useExpiringElement(element, labelID, true));
            expect(result.result.current.hasExpiration).toBe(true);
            expect(result.result.current.expirationTime).toBe(dateTimestamp);
        });

        it('should look for ContextExpirationTime in Labels', async () => {
            const result = await renderHook(() =>
                useExpiringElement(
                    {
                        ...element,
                        Labels: [
                            {
                                ID: labelID,
                                ContextExpirationTime: dateTimestamp,
                            },
                        ],
                    },
                    labelID,
                    true
                )
            );

            expect(result.result.current.hasExpiration).toBe(true);
            expect(result.result.current.expirationTime).toBe(dateTimestamp);
        });
    });

    describe('Conversation mode OFF', () => {
        const element = {
            ID: MESSAGE_ID,
        } as Message;
        const labelID = '0';

        it('Should not have expiration when no `ExpirationTime` on the Element and no `ExpirationTime` data or `expiresIn` draftFlag in message store', async () => {
            store.dispatch(initialize(getStoreMessage({ types: [], expirationTime: dateTimestamp })));
            const result = await renderHook(() => useExpiringElement(element, labelID, false));

            expect(result.result.current.hasExpiration).toBe(false);
            expect(result.result.current.expirationTime).toBe(0);
        });

        it('Should have expiration when `ExpirationTime` on the Element', async () => {
            store.dispatch(initialize(getStoreMessage({ types: [], expirationTime: dateTimestamp })));
            const result = await renderHook(() =>
                useExpiringElement(
                    {
                        ...element,
                        ExpirationTime: dateTimestamp,
                    },
                    labelID,
                    false
                )
            );

            expect(result.result.current.hasExpiration).toBe(true);
            expect(result.result.current.expirationTime).toBe(dateTimestamp);
        });

        it('Should have expiration when `expiresIn` is set on the message store draftFlags', async () => {
            store.dispatch(
                initialize(getStoreMessage({ types: ['withDraftFlagExpiresIn'], expirationTime: dateTimestamp }))
            );
            const result = await renderHook(() => useExpiringElement(element, labelID, false));

            expect(result.result.current.hasExpiration).toBe(true);
            expect(result.result.current.expirationTime).toBe(dateTimestamp);
        });

        it('Should have expiration when `ExpirationTime` is set on the message store data', async () => {
            store.dispatch(
                initialize(getStoreMessage({ types: ['withDataExpirationTime'], expirationTime: dateTimestamp }))
            );
            const result = await renderHook(() => useExpiringElement(element, labelID, false));

            expect(result.result.current.hasExpiration).toBe(true);
            expect(result.result.current.expirationTime).toBe(dateTimestamp);
        });
    });
});

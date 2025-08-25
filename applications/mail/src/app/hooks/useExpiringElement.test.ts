import { fromUnixTime, getUnixTime } from 'date-fns';

import type { MessageState } from '@proton/mail/store/messages/messagesTypes';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';

import { renderHook } from 'proton-mail/helpers/test/render';
import type { Conversation } from 'proton-mail/models/conversation';
import { initialize } from 'proton-mail/store/messages/read/messagesReadActions';

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

    describe('Conversation mode ON', () => {
        const conversationID = 'conversationID';
        const element = {
            ID: conversationID,
        } as Conversation;

        it('Should not have expiration when no `contextExpirationTime` on the Element and no `expiresIn` draftFlag in messages from store', async () => {
            const view = await renderHook({
                useCallback: () => useExpiringElement(element, MAILBOX_LABEL_IDS.INBOX, true),
                init: (store) => {
                    store.dispatch(initialize(getStoreMessage({ conversationID })));
                },
            });
            view.rerender();

            expect(view.result.current.hasExpiration).toBe(false);
            expect(view.result.current.expirationTime).toBe(0);
        });

        it('Should not have expiration with `expirationTime` data in messages from store', async () => {
            const view = await renderHook({
                useCallback: () => useExpiringElement(element, MAILBOX_LABEL_IDS.INBOX, true),
                init: (store) => {
                    store.dispatch(
                        initialize(
                            getStoreMessage({
                                conversationID,
                                types: ['withDataExpirationTime'],
                                expirationTime: dateTimestamp,
                            })
                        )
                    );
                },
            });

            expect(view.result.current.hasExpiration).toBe(false);
            expect(view.result.current.expirationTime).toBe(0);
        });

        it('Should have expiration with `expiresIn` draftFlag in messages from store', async () => {
            const view = await renderHook({
                useCallback: () => useExpiringElement(element, MAILBOX_LABEL_IDS.INBOX, true),
                init: (store) => {
                    store.dispatch(
                        initialize(
                            getStoreMessage({
                                conversationID,
                                types: ['withDraftFlagExpiresIn'],
                                expirationTime: dateTimestamp,
                            })
                        )
                    );
                },
            });
            expect(view.result.current.hasExpiration).toBe(true);
            expect(view.result.current.expirationTime).toBe(dateTimestamp);
        });

        it('should look for ContextExpirationTime in Labels', async () => {
            const view = await renderHook({
                useCallback: () =>
                    useExpiringElement(
                        {
                            ...element,
                            Labels: [
                                {
                                    ID: MAILBOX_LABEL_IDS.INBOX,
                                    ContextExpirationTime: dateTimestamp,
                                },
                            ],
                        },
                        MAILBOX_LABEL_IDS.INBOX,
                        true
                    ),
            });

            expect(view.result.current.hasExpiration).toBe(true);
            expect(view.result.current.expirationTime).toBe(dateTimestamp);
        });

        it('should not return the ContextExpirationTime and only the value in the label', async () => {
            const view = await renderHook({
                useCallback: () =>
                    useExpiringElement(
                        {
                            ...element,
                            Labels: [
                                {
                                    ID: MAILBOX_LABEL_IDS.INBOX,
                                    ContextExpirationTime: dateTimestamp,
                                },
                            ],
                        },
                        MAILBOX_LABEL_IDS.INBOX,
                        true
                    ),
            });

            expect(view.result.current.hasExpiration).toBe(true);
            expect(view.result.current.expirationTime).toBe(dateTimestamp);
        });

        it('should not return the ContextExpirationTime if not right label ID', async () => {
            const view = await renderHook({
                useCallback: () =>
                    useExpiringElement(
                        {
                            ...element,
                            Labels: [
                                {
                                    ID: MAILBOX_LABEL_IDS.TRASH,
                                    ContextExpirationTime: dateTimestamp,
                                },
                            ],
                        },
                        MAILBOX_LABEL_IDS.INBOX,
                        true
                    ),
            });

            expect(view.result.current.hasExpiration).toBe(false);
            expect(view.result.current.expirationTime).toBe(0);
        });
    });

    describe('Conversation mode OFF', () => {
        const element = {
            ID: MESSAGE_ID,
        } as Message;

        it('Should not have expiration when no `ExpirationTime` on the Element and no `ExpirationTime` data or `expiresIn` draftFlag in message store', async () => {
            const view = await renderHook({
                useCallback: () => useExpiringElement(element, MAILBOX_LABEL_IDS.INBOX, false),
                init: (store) => {
                    store.dispatch(initialize(getStoreMessage({ types: [], expirationTime: dateTimestamp })));
                },
            });

            expect(view.result.current.hasExpiration).toBe(false);
            expect(view.result.current.expirationTime).toBe(0);
        });

        it('Should have expiration when `ExpirationTime` on the Element', async () => {
            const view = await renderHook({
                useCallback: () =>
                    useExpiringElement(
                        {
                            ...element,
                            ExpirationTime: dateTimestamp,
                        },
                        MAILBOX_LABEL_IDS.INBOX,
                        false
                    ),
                init: (store) => {
                    store.dispatch(initialize(getStoreMessage({ types: [], expirationTime: dateTimestamp })));
                },
            });
            view.rerender();

            expect(view.result.current.hasExpiration).toBe(true);
            expect(view.result.current.expirationTime).toBe(dateTimestamp);
        });

        it('Should have expiration when `expiresIn` is set on the message store draftFlags', async () => {
            const view = await renderHook({
                useCallback: () => useExpiringElement(element, MAILBOX_LABEL_IDS.INBOX, false),
                init: (store) => {
                    store.dispatch(
                        initialize(
                            getStoreMessage({ types: ['withDraftFlagExpiresIn'], expirationTime: dateTimestamp })
                        )
                    );
                },
            });

            expect(view.result.current.hasExpiration).toBe(true);
            expect(view.result.current.expirationTime).toBe(dateTimestamp);
        });

        it('Should have expiration when `ExpirationTime` is set on the message store data', async () => {
            const view = await renderHook({
                useCallback: () => useExpiringElement(element, MAILBOX_LABEL_IDS.INBOX, false),
                init: (store) => {
                    store.dispatch(
                        initialize(
                            getStoreMessage({ types: ['withDataExpirationTime'], expirationTime: dateTimestamp })
                        )
                    );
                },
            });
            view.rerender();

            expect(view.result.current.hasExpiration).toBe(true);
            expect(view.result.current.expirationTime).toBe(dateTimestamp);
        });
    });
});

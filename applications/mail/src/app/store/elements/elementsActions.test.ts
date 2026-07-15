import type { ApiRateLimiter } from '@proton/shared/lib/api/apiRateLimiter';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import type { MailState } from '../rootReducer';
import type { MailThunkExtra } from '../store';
import { load } from './elementsActions';
import { newElementsState } from './elementsSlice';
import type { ElementsStateParams } from './elementsTypes';

const mockApiFn = jest.fn();
const mockApi = Object.assign(mockApiFn, {
    UID: undefined,
    addEventListener: jest.fn(),
    apiRateLimiter: jest.fn() as unknown as ApiRateLimiter,
    removeEventListener: jest.fn(),
});

const mockDispatch = jest.fn();

const mockExtra: MailThunkExtra['extra'] = {
    api: mockApi,
    calendarModelEventManager: {} as any,
    notificationManager: {} as any,
    eventManager: {} as any,
    history: {} as any,
    unleashClient: { isEnabled: jest.fn().mockReturnValue(false) } as any,
    authentication: {} as any,
    config: {} as any,
};

const buildMailState = (params: Partial<ElementsStateParams>, deletedSinceLastLoad = 0): MailState =>
    ({
        elements: { ...newElementsState({ params }), deletedSinceLastLoad },
    }) as MailState;

const mockStaleApiResponse = () => {
    mockApiFn.mockResolvedValue({
        Total: 0,
        Conversations: [],
        Stale: 1,
        TasksRunning: [],
    });
};

const mockFullPageApiResponse = (pageSize: number) => {
    mockApiFn.mockResolvedValue({
        Total: 1000,
        Conversations: Array.from({ length: pageSize }, (_, index) => ({ ID: `${index}`, Time: index })),
        Stale: 0,
        TasksRunning: [],
    });
};

describe('elementsActions.ts', () => {
    describe('load', () => {
        beforeEach(() => {
            jest.clearAllMocks();
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should schedule a fast retry when the response is Stale and the user is searching', async () => {
            mockStaleApiResponse();
            const mockGetState = jest.fn().mockReturnValue(
                buildMailState({
                    labelID: MAILBOX_LABEL_IDS.INBOX,
                    isSearching: true,
                    search: { keyword: 'foo' },
                })
            );

            const thunk = load({ page: 0, pageSize: 50, abortController: undefined });
            await thunk(mockDispatch, mockGetState, mockExtra);

            // Ignore the pending/fulfilled/showSerializedElements dispatches from the initial request
            mockDispatch.mockClear();

            // Default `count` is 1, so the first retry uses SEARCH_REFRESHES[1] = 2s.
            // No retry should be scheduled yet before that delay elapses.
            jest.advanceTimersByTime(1999);
            expect(mockDispatch).not.toHaveBeenCalled();

            jest.advanceTimersByTime(1);
            expect(mockDispatch).toHaveBeenCalledTimes(1);
        });

        it('should schedule the slower default retry when the response is Stale outside of search', async () => {
            mockStaleApiResponse();
            const mockGetState = jest.fn().mockReturnValue(
                buildMailState({
                    labelID: MAILBOX_LABEL_IDS.INBOX,
                    isSearching: false,
                    search: {},
                })
            );

            const thunk = load({ page: 0, pageSize: 50, abortController: undefined });
            await thunk(mockDispatch, mockGetState, mockExtra);

            // Ignore the pending/fulfilled/showSerializedElements dispatches from the initial request
            mockDispatch.mockClear();

            // Default `count` is 1, so the first retry uses REFRESHES[1] = 10s, well beyond the
            // 2s search backoff, confirming non-search retries are not sped up by this change.
            jest.advanceTimersByTime(9999);
            expect(mockDispatch).not.toHaveBeenCalled();

            jest.advanceTimersByTime(1);
            expect(mockDispatch).toHaveBeenCalledTimes(1);
        });

        describe('dynamic page fetch count', () => {
            it('should fetch enough batches to cover elements deleted since the last load, when searching', async () => {
                const pageSize = 50;
                mockFullPageApiResponse(pageSize);
                // 150 deleted elements at pageSize 50 => 3 pages to backfill, above the default of 2
                const mockGetState = jest
                    .fn()
                    .mockReturnValue(
                        buildMailState(
                            { labelID: MAILBOX_LABEL_IDS.INBOX, isSearching: true, search: { keyword: 'foo' } },
                            150
                        )
                    );

                const thunk = load({ page: 0, pageSize, abortController: undefined });
                await thunk(mockDispatch, mockGetState, mockExtra);

                expect(mockApiFn).toHaveBeenCalledTimes(3);
            });

            it('should cap the dynamic page fetch count to avoid excessive requests', async () => {
                const pageSize = 50;
                mockFullPageApiResponse(pageSize);
                // 1000 deleted elements would need 20 pages, but this should be capped
                const mockGetState = jest
                    .fn()
                    .mockReturnValue(
                        buildMailState(
                            { labelID: MAILBOX_LABEL_IDS.INBOX, isSearching: true, search: { keyword: 'foo' } },
                            1000
                        )
                    );

                const thunk = load({ page: 0, pageSize, abortController: undefined });
                await thunk(mockDispatch, mockGetState, mockExtra);

                expect(mockApiFn).toHaveBeenCalledTimes(5);
            });

            it('should use the default page fetch count when nothing was deleted, even while searching', async () => {
                const pageSize = 50;
                mockFullPageApiResponse(pageSize);
                const mockGetState = jest
                    .fn()
                    .mockReturnValue(
                        buildMailState(
                            { labelID: MAILBOX_LABEL_IDS.INBOX, isSearching: true, search: { keyword: 'foo' } },
                            0
                        )
                    );

                const thunk = load({ page: 0, pageSize, abortController: undefined });
                await thunk(mockDispatch, mockGetState, mockExtra);

                expect(mockApiFn).toHaveBeenCalledTimes(2);
            });

            it('should use the default page fetch count outside of search, regardless of deletedSinceLastLoad', async () => {
                const pageSize = 50;
                mockFullPageApiResponse(pageSize);
                const mockGetState = jest
                    .fn()
                    .mockReturnValue(
                        buildMailState({ labelID: MAILBOX_LABEL_IDS.INBOX, isSearching: false, search: {} }, 150)
                    );

                const thunk = load({ page: 0, pageSize, abortController: undefined });
                await thunk(mockDispatch, mockGetState, mockExtra);

                expect(mockApiFn).toHaveBeenCalledTimes(2);
            });
        });
    });
});

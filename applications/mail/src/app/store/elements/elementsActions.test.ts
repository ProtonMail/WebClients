import type { ApiRateLimiter } from '@proton/shared/lib/api/apiRateLimiter';
import type { CategoryLabelID } from '@proton/shared/lib/constants';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';
import { mockNotifications } from '@proton/testing/lib/mockNotifications';

import type { MailState } from '../rootReducer';
import type { MailThunkExtra } from '../store';
import { backendActionFinished, labelAll, load, markAll, moveAll } from './elementsActions';
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

    describe('markAll', () => {
        beforeEach(() => {
            jest.clearAllMocks();
            jest.useFakeTimers();
            mockApiFn.mockResolvedValue({});
        });

        afterEach(() => {
            jest.clearAllTimers();
            jest.useRealTimers();
        });

        const runMarkAll = async (
            listCategoryIDs: CategoryLabelID[],
            params: Omit<Parameters<typeof markAll>[0], 'SourceLabelID' | 'status'>
        ) => {
            const mockGetState = jest
                .fn()
                .mockReturnValue(buildMailState({ labelID: MAILBOX_LABEL_IDS.INBOX, categoryIDs: listCategoryIDs }));

            await markAll({ SourceLabelID: MAILBOX_LABEL_IDS.INBOX, status: MARK_AS_STATUS.READ, ...params })(
                mockDispatch,
                mockGetState,
                mockExtra
            );

            return mockApiFn.mock.calls[0][0].data.SearchContext.LabelIDs;
        };

        it('should scope the mark to the categories the caller asks for', async () => {
            await expect(runMarkAll([], { categoryIDs: [MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS] })).resolves.toEqual([
                MAILBOX_LABEL_IDS.INBOX,
                MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS,
            ]);
        });

        it('should cover the whole Inbox for an empty scope, ignoring the tab the list is showing', async () => {
            await expect(runMarkAll([MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS], { categoryIDs: [] })).resolves.toEqual([
                MAILBOX_LABEL_IDS.INBOX,
            ]);
        });

        it('should fall back to the categories the list is showing when no scope is given', async () => {
            await expect(runMarkAll([MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS], {})).resolves.toEqual([
                MAILBOX_LABEL_IDS.INBOX,
                MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS,
            ]);
        });
    });

    describe('whole-location thunks', () => {
        const extraWithNotifications: MailThunkExtra['extra'] = {
            ...mockExtra,
            notificationManager: mockNotifications,
        };

        const wholeLocationThunks = [
            [
                'moveAll',
                () => {
                    return moveAll({
                        SourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                        DestinationLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                    });
                },
            ],
            [
                'markAll',
                () => {
                    return markAll({ SourceLabelID: MAILBOX_LABEL_IDS.INBOX, status: MARK_AS_STATUS.READ });
                },
            ],
            [
                'labelAll',
                () => {
                    return labelAll({
                        SourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                        toLabel: ['label'],
                        toUnlabel: [],
                    });
                },
            ],
        ] as const;

        beforeEach(() => {
            jest.clearAllMocks();
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.clearAllTimers();
            jest.useRealTimers();
        });

        describe.each(wholeLocationThunks)('%s', (_name, buildThunk) => {
            const run = () => {
                const mockGetState = jest
                    .fn()
                    .mockReturnValue(buildMailState({ labelID: MAILBOX_LABEL_IDS.INBOX, categoryIDs: [] }));

                return buildThunk()(mockDispatch, mockGetState, extraWithNotifications);
            };

            it('should reject so the caller can tell the request failed', async () => {
                mockApiFn.mockRejectedValue(new Error('Request failed'));

                await expect(run().unwrap()).rejects.toMatchObject({ message: 'Request failed' });
            });

            it('should still warn the user and finish the backend action when the request fails', async () => {
                mockApiFn.mockRejectedValue(new Error('Request failed'));

                await run();

                expect(mockNotifications.clearNotifications).toHaveBeenCalled();
                expect(mockNotifications.createNotification).toHaveBeenCalledWith(
                    expect.objectContaining({ type: 'error' })
                );
                expect(mockDispatch).toHaveBeenCalledWith(backendActionFinished());
            });

            it('should resolve with the source label when the request succeeds', async () => {
                mockApiFn.mockResolvedValue({});

                await expect(run().unwrap()).resolves.toMatchObject({ LabelID: MAILBOX_LABEL_IDS.INBOX });
            });
        });
    });
});

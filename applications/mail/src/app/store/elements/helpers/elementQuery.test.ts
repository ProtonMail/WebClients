import type { MailboxItemsQueryParams } from '@proton/shared/lib/api/mailbox';
import range from '@proton/utils/range';

import type { ElementsStateParams } from '../elementsTypes';
import { queryElementsInBatch } from './elementQuery';

const buildFiftyItems = (start: number = 0, count = 50) => {
    return range(start, start + count).map((_, index) => ({
        ID: `${index + start}`,
        Time: `anchor-${index + start}`,
    }));
};

const baseElementsStateParams: ElementsStateParams = {
    labelID: 'all-mail',
    conversationMode: true,
    sort: { sort: 'Time', desc: true },
    filter: {},
    search: {},
    esEnabled: false,
    isSearching: false,
};

const mockElementsApiCall = (
    mockedApi: jest.Mock,
    { start = 0, count = 50, total }: { start?: number; count?: number; total?: number } = {
        start: 0,
        count: 50,
    },
    elementsField = 'Conversations'
) => {
    const batch = buildFiftyItems(start, count);
    mockedApi.mockResolvedValueOnce({
        Total: total ?? count - start,
        [elementsField]: batch,
        Stale: false,
        TasksRunning: false,
    });

    return batch;
};

const expectedQuery = (params?: Partial<MailboxItemsQueryParams>) => ({
    method: 'get',
    params: {
        Desc: 1,
        Limit: 50,
        Sort: 'Time',
        ...params,
    },
    url: 'mail/v4/conversations',
});

describe('elementQuery.ts', () => {
    describe('queryElementsInBatch', () => {
        describe('when pageSize is 50 (matches `MAX_MESSAGES_FETCH_CHUNK_SIZE`)', () => {
            describe('when api returns empty Elements array', () => {
                it('should return empty result', async () => {
                    const mockedApi = jest.fn();

                    const firstBatch = mockElementsApiCall(mockedApi, {
                        count: 0,
                    });

                    const clientPage = 0;
                    const settingsPageSize = 50;

                    const result = await queryElementsInBatch({
                        api: mockedApi,
                        page: clientPage,
                        pageSize: settingsPageSize,
                        params: baseElementsStateParams,
                        disabledCategoriesIDs: [],
                    });

                    expect(result).toHaveProperty('More', false);
                    expect(result).toHaveProperty('Total', 0);
                    expect(result).toHaveProperty('Elements', firstBatch);
                    expect(result).toHaveProperty('Stale', false);
                    expect(result).toHaveProperty('TasksRunning', false);

                    expect(mockedApi).toHaveBeenCalledTimes(1);
                    expect(mockedApi.mock.calls[0][0]).toMatchObject(
                        expectedQuery({ Page: clientPage, PageSize: settingsPageSize })
                    );
                });
            });

            describe('when there is less than 50 items to fetch', () => {
                it('should perform only 1 call', async () => {
                    const mockedApi = jest.fn();

                    const firstBatch = mockElementsApiCall(mockedApi, {
                        count: 32,
                    });

                    const clientPage = 0;
                    const settingsPageSize = 50;

                    const result = await queryElementsInBatch({
                        api: mockedApi,
                        page: clientPage,
                        pageSize: settingsPageSize,
                        params: baseElementsStateParams,
                        disabledCategoriesIDs: [],
                    });

                    expect(result).toHaveProperty('More', false);
                    expect(result).toHaveProperty('Total', 32);
                    expect(result).toHaveProperty('Elements', firstBatch);
                    expect(result).toHaveProperty('Stale', false);
                    expect(result).toHaveProperty('TasksRunning', false);

                    expect(mockedApi).toHaveBeenCalledTimes(1);
                    expect(mockedApi.mock.calls[0][0]).toMatchObject(
                        expectedQuery({ Page: clientPage, PageSize: settingsPageSize })
                    );
                });
            });

            describe('when there are more than 50 items to fetch', () => {
                it('should perform only 2 call, first + next', async () => {
                    const mockedApi = jest.fn();

                    mockElementsApiCall(mockedApi, {
                        total: 82,
                    });
                    mockElementsApiCall(mockedApi, {
                        start: 50,
                        count: 32,
                        total: 82,
                    });

                    const clientPage = 0;
                    const settingsPageSize = 50;

                    const result = await queryElementsInBatch({
                        api: mockedApi,
                        page: clientPage,
                        pageSize: settingsPageSize,
                        params: baseElementsStateParams,
                        disabledCategoriesIDs: [],
                    });

                    expect(result).toHaveProperty('More', false);
                    expect(result).toHaveProperty('Total', 82);
                    expect(result).toHaveProperty('Elements', buildFiftyItems(settingsPageSize, 82 - settingsPageSize));
                    expect(result).toHaveProperty('Stale', false);
                    expect(result).toHaveProperty('TasksRunning', false);

                    expect(mockedApi).toHaveBeenCalledTimes(2);
                    expect(mockedApi.mock.calls[0][0]).toMatchObject(
                        expectedQuery({ Page: clientPage, PageSize: settingsPageSize })
                    );
                    expect(mockedApi.mock.calls[1][0]).toMatchObject(
                        expectedQuery({ Anchor: 'anchor-49', AnchorID: '49' })
                    );
                });
            });

            describe('when user is not on first page', () => {
                it('should perform call accordingly', async () => {
                    const mockedApi = jest.fn();

                    const firstBatch = mockElementsApiCall(mockedApi, {
                        start: 150,
                        count: 32,
                        total: 182,
                    });

                    const clientPage = 3;
                    const settingsPageSize = 50;

                    const result = await queryElementsInBatch({
                        api: mockedApi,
                        page: clientPage,
                        pageSize: settingsPageSize,
                        params: baseElementsStateParams,
                        disabledCategoriesIDs: [],
                    });

                    expect(result).toHaveProperty('More', false);
                    expect(result).toHaveProperty('Total', 182);
                    expect(result).toHaveProperty('Elements', firstBatch);
                    expect(result).toHaveProperty('Stale', false);
                    expect(result).toHaveProperty('TasksRunning', false);

                    expect(mockedApi).toHaveBeenCalledTimes(1);
                    expect(mockedApi.mock.calls[0][0]).toMatchObject(expectedQuery({ Page: 3 }));
                });
            });
        });

        describe('when pageSize is 100', () => {
            it('should perform 2 calls', async () => {
                const mockedApi = jest.fn();
                const clientPage = 0;
                const settingsPageSize = 100;

                mockElementsApiCall(mockedApi, { count: settingsPageSize, total: 200 });
                mockElementsApiCall(mockedApi, { start: 100, count: settingsPageSize, total: 200 });

                const result = await queryElementsInBatch({
                    api: mockedApi,
                    page: clientPage,
                    pageSize: settingsPageSize,
                    params: baseElementsStateParams,
                    disabledCategoriesIDs: [],
                });

                // expect(result).toHaveProperty('More', true);
                expect(result).toHaveProperty('Total', 200);
                expect(result).toHaveProperty('Elements', buildFiftyItems(settingsPageSize, 200 - settingsPageSize));
                expect(result).toHaveProperty('Stale', false);
                expect(result).toHaveProperty('TasksRunning', false);

                expect(mockedApi).toHaveBeenCalledTimes(2);

                expect(mockedApi.mock.calls[0][0]).toMatchObject(expectedQuery({ Limit: settingsPageSize }));
                expect(mockedApi.mock.calls[1][0]).toMatchObject(
                    expectedQuery({ Limit: settingsPageSize, AnchorID: '99', Anchor: 'anchor-99' })
                );
            });
        });

        describe('when pageSize is 200', () => {
            it('should perform 2 calls', async () => {
                const mockedApi = jest.fn();

                mockElementsApiCall(mockedApi, { count: 200, total: 400 });
                mockElementsApiCall(mockedApi, { start: 200, count: 200, total: 400 });

                const clientPage = 0;
                const settingsPageSize = 200;

                const result = await queryElementsInBatch({
                    api: mockedApi,
                    page: clientPage,
                    pageSize: settingsPageSize,
                    params: baseElementsStateParams,
                    disabledCategoriesIDs: [],
                });

                // expect(result).toHaveProperty('More', true);
                expect(result).toHaveProperty('Total', 400);
                expect(result).toHaveProperty('Elements', buildFiftyItems(settingsPageSize, 400 - settingsPageSize));
                expect(result).toHaveProperty('Stale', false);
                expect(result).toHaveProperty('TasksRunning', false);

                expect(mockedApi).toHaveBeenCalledTimes(2);

                expect(mockedApi.mock.calls[0][0]).toMatchObject(expectedQuery({ Limit: settingsPageSize }));
                expect(mockedApi.mock.calls[1][0]).toMatchObject(
                    expectedQuery({ Limit: settingsPageSize, AnchorID: '199', Anchor: 'anchor-199' })
                );
            });
        });

        describe('when user is in message view mode', () => {
            it('should call messages metadata call', async () => {
                const conversationMode = false;
                const mockedApi = jest.fn();

                const firstBatch = mockElementsApiCall(mockedApi, { count: 32 }, 'Messages');

                const clientPage = 0;
                const settingsPageSize = 50;

                const result = await queryElementsInBatch({
                    api: mockedApi,
                    page: clientPage,
                    pageSize: settingsPageSize,
                    params: {
                        ...baseElementsStateParams,
                        conversationMode,
                    },
                    disabledCategoriesIDs: [],
                });

                expect(result).toHaveProperty('More', false);
                expect(result).toHaveProperty('Total', 32);
                expect(result).toHaveProperty('Elements', firstBatch);
                expect(result).toHaveProperty('Stale', false);
                expect(result).toHaveProperty('TasksRunning', false);

                expect(mockedApi).toHaveBeenCalledTimes(1);
                expect(mockedApi.mock.calls[0][0]).toMatchObject({
                    ...expectedQuery(),
                    url: 'mail/v4/messages',
                });
            });
        });
    });
});

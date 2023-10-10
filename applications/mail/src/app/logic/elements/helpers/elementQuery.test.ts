import { MailboxItemsQueryParams } from '@proton/shared/lib/api/mailbox';
import { MAX_MESSAGES_FETCH_CHUNK_SIZE } from '@proton/shared/lib/constants';
import range from '@proton/utils/range';

import { ElementsStateParams } from '../elementsTypes';
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
};

const mockElementsApiCall = (
    mockedApi: jest.Mock,
    { start = 0, count = 50 } = { start: 0, count: 50 },
    elementsField = 'Conversations'
) => {
    const batch = buildFiftyItems(start, count);
    mockedApi.mockResolvedValueOnce({
        Total: batch.length,
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
        Page: 0,
        PageSize: MAX_MESSAGES_FETCH_CHUNK_SIZE,
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

                    const firstBatch = mockElementsApiCall(mockedApi, { count: 0 });

                    const clientPage = 0;
                    const settingsPageSize = 50;

                    const result = await queryElementsInBatch(
                        mockedApi,
                        clientPage,
                        settingsPageSize,
                        baseElementsStateParams
                    );

                    expect(result).toHaveProperty('More', false);
                    expect(result).toHaveProperty('Total', 0);
                    expect(result).toHaveProperty('Elements', firstBatch);
                    expect(result).toHaveProperty('Stale', false);
                    expect(result).toHaveProperty('TasksRunning', false);

                    expect(mockedApi).toHaveBeenCalledTimes(1);
                    expect(mockedApi.mock.calls[0][0]).toMatchObject(expectedQuery());
                });
            });

            describe('when there is less than 50 items to fetch', () => {
                it('should perform only 1 call', async () => {
                    const mockedApi = jest.fn();

                    const firstBatch = mockElementsApiCall(mockedApi, { count: 32 });

                    const clientPage = 0;
                    const settingsPageSize = 50;

                    const result = await queryElementsInBatch(
                        mockedApi,
                        clientPage,
                        settingsPageSize,
                        baseElementsStateParams
                    );

                    expect(result).toHaveProperty('More', false);
                    expect(result).toHaveProperty('Total', 32);
                    expect(result).toHaveProperty('Elements', firstBatch);
                    expect(result).toHaveProperty('Stale', false);
                    expect(result).toHaveProperty('TasksRunning', false);

                    expect(mockedApi).toHaveBeenCalledTimes(1);
                    expect(mockedApi.mock.calls[0][0]).toMatchObject(expectedQuery());
                });
            });

            describe('when there are more than 50 items to fetch', () => {
                it('should perform only 2 call, first + next', async () => {
                    const mockedApi = jest.fn();

                    mockElementsApiCall(mockedApi);
                    mockElementsApiCall(mockedApi, { start: 50, count: 32 });

                    const clientPage = 0;
                    const settingsPageSize = 50;

                    const result = await queryElementsInBatch(
                        mockedApi,
                        clientPage,
                        settingsPageSize,
                        baseElementsStateParams
                    );

                    expect(result).toHaveProperty('More', false);
                    expect(result).toHaveProperty('Total', 82);
                    expect(result).toHaveProperty('Elements', buildFiftyItems(0, 82));
                    expect(result).toHaveProperty('Stale', false);
                    expect(result).toHaveProperty('TasksRunning', false);

                    expect(mockedApi).toHaveBeenCalledTimes(2);
                    expect(mockedApi.mock.calls[0][0]).toMatchObject(expectedQuery());
                    expect(mockedApi.mock.calls[1][0]).toMatchObject(
                        expectedQuery({ Anchor: 'anchor-49', AnchorID: '49' })
                    );
                });
            });

            describe('when user is not on first page', () => {
                it('should perform call accordingly', async () => {
                    const mockedApi = jest.fn();

                    const firstBatch = mockElementsApiCall(mockedApi, { start: 150, count: 32 });

                    const clientPage = 3;
                    const settingsPageSize = 50;

                    const result = await queryElementsInBatch(
                        mockedApi,
                        clientPage,
                        settingsPageSize,
                        baseElementsStateParams
                    );

                    expect(result).toHaveProperty('More', false);
                    expect(result).toHaveProperty('Total', 32);
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

                mockElementsApiCall(mockedApi);
                mockElementsApiCall(mockedApi, { start: 50 });

                const clientPage = 0;
                const settingsPageSize = 100;

                const result = await queryElementsInBatch(
                    mockedApi,
                    clientPage,
                    settingsPageSize,
                    baseElementsStateParams
                );

                expect(result).toHaveProperty('More', true);
                expect(result).toHaveProperty('Total', 100);
                expect(result).toHaveProperty('Elements', buildFiftyItems(0, 100));
                expect(result).toHaveProperty('Stale', false);
                expect(result).toHaveProperty('TasksRunning', false);

                expect(mockedApi).toHaveBeenCalledTimes(2);

                expect(mockedApi.mock.calls[0][0]).toMatchObject(expectedQuery());
                expect(mockedApi.mock.calls[1][0]).toMatchObject(
                    expectedQuery({ AnchorID: '49', Anchor: 'anchor-49' })
                );
            });
        });

        describe('when pageSize is 200', () => {
            it('should perform 4 calls', async () => {
                const mockedApi = jest.fn();

                mockElementsApiCall(mockedApi);
                mockElementsApiCall(mockedApi, { start: 50 });
                mockElementsApiCall(mockedApi, { start: 100 });
                mockElementsApiCall(mockedApi, { start: 150 });

                const clientPage = 0;
                const settingsPageSize = 200;

                const result = await queryElementsInBatch(
                    mockedApi,
                    clientPage,
                    settingsPageSize,
                    baseElementsStateParams
                );

                expect(result).toHaveProperty('More', true);
                expect(result).toHaveProperty('Total', 200);
                expect(result).toHaveProperty('Elements', buildFiftyItems(0, 200));
                expect(result).toHaveProperty('Stale', false);
                expect(result).toHaveProperty('TasksRunning', false);

                expect(mockedApi).toHaveBeenCalledTimes(4);

                expect(mockedApi.mock.calls[0][0]).toMatchObject(expectedQuery());
                expect(mockedApi.mock.calls[1][0]).toMatchObject(
                    expectedQuery({ AnchorID: '49', Anchor: 'anchor-49' })
                );
                expect(mockedApi.mock.calls[2][0]).toMatchObject(
                    expectedQuery({ AnchorID: '99', Anchor: 'anchor-99' })
                );
                expect(mockedApi.mock.calls[3][0]).toMatchObject(
                    expectedQuery({ AnchorID: '149', Anchor: 'anchor-149' })
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

                const result = await queryElementsInBatch(mockedApi, clientPage, settingsPageSize, {
                    ...baseElementsStateParams,
                    conversationMode,
                });

                expect(result).toHaveProperty('More', false);
                expect(result).toHaveProperty('Total', 32);
                expect(result).toHaveProperty('Elements', firstBatch);
                expect(result).toHaveProperty('Stale', false);
                expect(result).toHaveProperty('TasksRunning', false);

                expect(mockedApi).toHaveBeenCalledTimes(1);
                expect(mockedApi.mock.calls[0][0]).toMatchObject({ ...expectedQuery(), url: 'mail/v4/messages' });
            });
        });
    });
});

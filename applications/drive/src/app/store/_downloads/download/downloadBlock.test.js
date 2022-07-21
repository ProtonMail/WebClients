import downloadBlock from './downloadBlock';

describe('download block', () => {
    it('waits specified time when rate limited', async () => {
        const mockFetch = jest.fn(() => {
            // Fail only once.
            if (mockFetch.mock.calls.length === 1) {
                return Promise.resolve({
                    status: 429,
                    response: {
                        headers: new Headers({ 'retry-after': '1' }),
                    },
                });
            }
            return Promise.resolve({
                body: new ReadableStream({
                    start(controller) {
                        controller.enqueue([42]);
                    },
                }),
            });
        });
        global.fetch = mockFetch;

        await downloadBlock(new AbortController(), 'url', 'token');
        expect(mockFetch).toBeCalledTimes(2);
    });
});

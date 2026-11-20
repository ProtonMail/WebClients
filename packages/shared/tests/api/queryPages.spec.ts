import queryPages from '../../lib/api/helpers/queryPages';

describe('query pages', () => {
    it('should be able to process multiple pages', async () => {
        const result = await queryPages(
            async (n) => {
                return {
                    Value: n,
                    Total: 5,
                };
            },
            {
                pageSize: 1,
                pagesPerChunk: 1,
                delayPerChunk: 1,
            }
        ).then((pages) => {
            return pages.map(({ Value }) => Value);
        });
        expect(result).toEqual([0, 1, 2, 3, 4]);
    });

    it('should return the first page without a total', async () => {
        const result = await queryPages(
            async () => {
                return {
                    Value: 0,
                } as any;
            },
            {
                pageSize: 100,
                pagesPerChunk: 20,
                delayPerChunk: 1,
            }
        ).then((pages) => {
            return pages.map(({ Value }) => Value);
        });
        expect(result).toEqual([0]);
    });

    it('should run at most maxConcurrency pages at once', async () => {
        let running = 0;
        let maxRunning = 0;
        const result = await queryPages(
            async (n) => {
                running++;
                maxRunning = Math.max(maxRunning, running);
                await new Promise((resolve) => setTimeout(resolve, 1));
                running--;
                return { Value: n, Total: 10 };
            },
            { pageSize: 1, maxConcurrency: 3 }
        ).then((pages) => pages.map(({ Value }) => Value));

        expect(result).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
        expect(maxRunning).toBe(3);
    });

    it('should stop requesting pages after one fails with maxConcurrency', async () => {
        const error = new Error('page failed');
        const requested: number[] = [];
        const promise = queryPages(
            async (n) => {
                requested.push(n);
                await new Promise((resolve) => setTimeout(resolve, 1));
                if (n === 1) {
                    throw error;
                }
                return { Total: 10 };
            },
            { pageSize: 1, maxConcurrency: 2 }
        );

        await expect(promise).rejects.toBe(error);
        // Let the remaining worker settle before counting
        await new Promise((resolve) => setTimeout(resolve, 20));
        expect(requested).toEqual([0, 1, 2]);
    });

    it('should return several pages', async () => {
        const result = await queryPages(
            async (n) => {
                return {
                    Value: n,
                    Total: 4,
                };
            },
            {
                pageSize: 2,
                pagesPerChunk: 20,
                delayPerChunk: 1,
            }
        ).then((pages) => {
            return pages.map(({ Value }) => Value);
        });
        expect(result).toEqual([0, 1]);
    });
});

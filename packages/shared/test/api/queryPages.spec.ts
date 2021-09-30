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

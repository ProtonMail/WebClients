import { SearchService } from './searchService';

describe('SearchService.rankConversations', () => {
    const setup = (results: [number, string][]) => {
        const service = SearchService.get();
        const searchWithWorker = jest
            .spyOn(
                service as unknown as { searchWithWorker: (query: string) => Promise<[number, string][]> },
                'searchWithWorker'
            )
            .mockResolvedValue(results);
        return { service, searchWithWorker };
    };

    afterEach(() => jest.restoreAllMocks());

    it('matches any word, leaving out operators, repeats and single letters', async () => {
        const { service, searchWithWorker } = setup([]);

        await service.rankConversations('Budget AND the budget OR Q3 report, a NOT', 10);

        expect(searchWithWorker).toHaveBeenCalledWith('budget OR the OR q3 OR report');
    });

    it('keeps the index order and the limit', async () => {
        const { service } = setup([
            [9, 'best'],
            [5, 'second'],
            [1, 'third'],
        ]);

        expect(await service.rankConversations('budget', 2)).toEqual(['best', 'second']);
    });

    it('skips the index for a query with no words', async () => {
        const { service, searchWithWorker } = setup([[1, 'any']]);

        expect(await service.rankConversations('?! -', 5)).toEqual([]);
        expect(searchWithWorker).not.toHaveBeenCalled();
    });
});

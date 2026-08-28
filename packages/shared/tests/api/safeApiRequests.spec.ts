import { processApiRequestsSafe } from '../../lib/api/helpers/safeApiRequests';
import { wait } from '../../lib/helpers/promise';

describe('safe api requests', () => {
    it('it can process the full batch', async () => {
        const generators = [1, 1].map((n, i) => {
            return async () => {
                await wait(n);
                return i;
            };
        });
        const result = await processApiRequestsSafe(generators, 2, 100);
        expect(result).toEqual([0, 1]);
    });

    it('it returns the result in order', async () => {
        const generators = [2000, 500, 2, 300, 100, 1000].map((n, i) => {
            return async () => {
                await wait(n);
                return i;
            };
        });
        const result = await processApiRequestsSafe(generators, 2, 100);
        expect(result).toEqual([0, 1, 2, 3, 4, 5]);
    });
});

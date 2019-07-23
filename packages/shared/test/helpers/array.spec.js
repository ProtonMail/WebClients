import { uniqueBy, move } from '../../lib/helpers/array';

describe('array', () => {
    describe('unique by', () => {
        it('should only get unique items', async () => {
            const list = [{ foo: 'abc' }, { foo: 'bar' }, { foo: 'asd' }, { foo: 'bar' }, { foo: 'bar' }];
            expect(uniqueBy(list, ({ foo }) => foo)).toEqual([{ foo: 'abc' }, { foo: 'bar' }, { foo: 'asd' }]);
        });

        it('should only get unique items', async () => {
            const list = [{ foo: 'abc' }, { foo: 'bar' }];
            expect(uniqueBy(list, ({ foo }) => foo)).toEqual([{ foo: 'abc' }, { foo: 'bar' }]);
        });
    });

    describe('move', () => {
        it('should return a new array', async () => {
            const list = [1, 2, 3, 4, 5];
            expect(move(list, 0, 0) !== list).toBeTruthy();
        });
        it('should correctly move elements to new positions', async () => {
            const list = [1, 2, 3, 4, 5];
            expect(move(list, 3, 0)).toEqual([4, 1, 2, 3, 5]);
        });
        it('should be able to handle negative indices', async () => {
            const list = [1, 2, 3, 4, 5];
            expect(move(list, -1, 0)).toEqual([5, 1, 2, 3, 4]);
            expect(move(list, 1, -2)).toEqual([1, 3, 4, 2, 5]);
            expect(move(list, -3, -4)).toEqual([1, 3, 2, 4, 5]);
        });
    });
});

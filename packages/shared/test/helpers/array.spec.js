import { unique, uniqueBy, move } from '../../lib/helpers/array';

describe('array', () => {
    describe('unique', () => {
        it('should return same', () => {
            expect(unique([1, 2])).toEqual([1, 2]);
        });
        it('should only return unique items', () => {
            expect(unique([1, 2, 1])).toEqual([1, 2]);
        });
    });

    describe('unique by', () => {
        it('should only get unique items', () => {
            const list = [{ foo: 'abc' }, { foo: 'bar' }, { foo: 'asd' }, { foo: 'bar' }, { foo: 'bar' }];
            expect(uniqueBy(list, ({ foo }) => foo)).toEqual([{ foo: 'abc' }, { foo: 'bar' }, { foo: 'asd' }]);
        });
        it('should only get unique items', () => {
            const list = [{ foo: 'abc' }, { foo: 'bar' }];
            expect(uniqueBy(list, ({ foo }) => foo)).toEqual([{ foo: 'abc' }, { foo: 'bar' }]);
        });
    });

    describe('move', () => {
        it('should return a new array', () => {
            const list = [1, 2, 3, 4, 5];
            expect(move(list, 0, 0) !== list).toBeTruthy();
        });
        it('should correctly move elements to new positions', () => {
            const list = [1, 2, 3, 4, 5];
            expect(move(list, 3, 0)).toEqual([4, 1, 2, 3, 5]);
        });
        it('should be able to handle negative indices', () => {
            const list = [1, 2, 3, 4, 5];
            expect(move(list, -1, 0)).toEqual([5, 1, 2, 3, 4]);
            expect(move(list, 1, -2)).toEqual([1, 3, 4, 2, 5]);
            expect(move(list, -3, -4)).toEqual([1, 3, 2, 4, 5]);
        });
    });
});

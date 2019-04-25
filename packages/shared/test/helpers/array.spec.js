import { uniqueBy } from '../../lib/helpers/array';

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
});

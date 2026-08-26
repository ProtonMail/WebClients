import uniqueBy from './uniqueBy';

describe('uniqueBy()', () => {
    it('should only get unique items', () => {
        const list = [{ foo: 'abc' }, { foo: 'bar' }, { foo: 'asd' }, { foo: 'bar' }, { foo: 'bar' }];
        expect(uniqueBy(list, ({ foo }) => foo)).toEqual([{ foo: 'abc' }, { foo: 'bar' }, { foo: 'asd' }]);
    });

    it('should only get unique items', () => {
        const list = [{ foo: 'abc' }, { foo: 'bar' }];
        expect(uniqueBy(list, ({ foo }) => foo)).toEqual([{ foo: 'abc' }, { foo: 'bar' }]);
    });
});

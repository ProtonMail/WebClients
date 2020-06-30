import createLRU from '../../lib/helpers/lru';

describe('lru', () => {
    [
        {
            entries: [
                ['a', '1'],
                ['b', '2'],
                ['c', '3']
            ],
            max: 1,
            result: [['c', '3']]
        },
        {
            entries: [
                ['a', '1'],
                ['b', '2']
            ],
            max: 2,
            result: [
                ['a', '1'],
                ['b', '2']
            ]
        },
        {
            entries: [
                ['a', '1'],
                ['b', '2'],
                ['c', '3']
            ],
            max: 2,
            result: [
                ['b', '2'],
                ['c', '3']
            ]
        },
        {
            entries: [],
            max: 2,
            result: []
        },
        {
            entries: [['a', '1']],
            max: 2,
            result: [['a', '1']]
        }
    ].forEach(({ entries, max, result }, i) => {
        it(`should iterate all keys ${i}`, () => {
            const lru = createLRU({ max });
            entries.forEach(([k, v]) => {
                lru.set(k, v);
            });
            expect([...lru]).toEqual(result);
        });
    });

    it('should set and dispose values', () => {
        const lru = createLRU({ max: 2 });
        lru.set('a', 1);
        expect(lru.size).toEqual(1);
        expect(lru.get('a')).toEqual(1);
        expect(lru.has('a')).toEqual(true);
        lru.set('a', 2);
        expect(lru.size).toEqual(1);
        expect(lru.get('a')).toEqual(2);
        lru.set('b', 3);
        expect(lru.size).toEqual(2);
        expect(lru.get('b')).toEqual(3);
        expect(lru.get('a')).toEqual(2);
        lru.set('b', 4);
        expect(lru.get('b')).toEqual(4);
        lru.set('c', 5);
        expect(lru.get('c')).toEqual(5);
        expect(lru.get('a')).toEqual(undefined);
        expect([...lru.keys()]).toEqual(['b', 'c']);
        expect([...lru.values()]).toEqual([4, 5]);
        lru.delete('c');
        expect(lru.get('c')).toEqual(undefined);
        expect(lru.get('b')).toEqual(4);
        lru.clear();
        expect(lru.get('b')).toEqual(undefined);
        expect(lru.size).toEqual(0);
    });
});

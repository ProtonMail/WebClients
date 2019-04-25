import { runChunksDelayed, wait } from '../../lib/helpers/promise';

describe('promise', () => {
    describe('chunks delayed', () => {
        it('should call chunks in a specific interval', async () => {
            const chunks = [[1, 2], ['a', 'b']];
            const resultMap = {
                1: 'foo',
                2: 'bar',
                a: 'baz',
                b: 'qux'
            };
            const cb = (value) => {
                return resultMap[value];
            };
            const spy = jasmine.createSpy('result').and.callFake(cb);
            const promise = runChunksDelayed(chunks, spy, 100);
            await wait(80);
            expect(spy.calls.all().length).toEqual(2);
            const result = await promise;
            expect(spy.calls.all().length).toEqual(4);
            expect(result).toEqual(['foo', 'bar', 'baz', 'qux']);
        });
    });
});

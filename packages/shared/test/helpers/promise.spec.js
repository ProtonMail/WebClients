import { describe, it } from 'mocha';
import assert from 'assert';

import { createSpy } from '../spy';
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
            const cb = createSpy((value) => {
                return resultMap[value];
            });
            const promise = runChunksDelayed(chunks, cb, 100);
            await wait(80);
            assert.strictEqual(cb.calls.length, 2);
            const result = await promise;
            assert.strictEqual(cb.calls.length, 4);
            assert.deepStrictEqual(result, ['foo', 'bar', 'baz', 'qux']);
        });
    });
});

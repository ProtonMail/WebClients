import { deserialize, serialize } from './serialize';

describe('serialize / deserialize', () => {
    test('round-trips plain objects', () => {
        const obj = { a: 1, b: 'hello', c: true };
        expect(deserialize(serialize(obj))).toEqual(obj);
    });

    test('round-trips Uint8Array', () => {
        const arr = new Uint8Array([1, 2, 3, 255]);
        const result = deserialize<{ data: Uint8Array<ArrayBuffer> }>(serialize({ data: arr }));
        expect(result.data).toBeInstanceOf(Uint8Array);
        expect(result.data).toEqual(arr);
    });

    test('round-trips empty Uint8Array', () => {
        const arr = new Uint8Array(0);
        const result = deserialize<{ data: Uint8Array<ArrayBuffer> }>(serialize({ data: arr }));
        expect(result.data).toBeInstanceOf(Uint8Array);
        expect(result.data.length).toBe(0);
    });

    test('round-trips nested Uint8Arrays', () => {
        const obj = { outer: { inner: new Uint8Array([10, 20]) } };
        const result = deserialize<typeof obj>(serialize(obj));
        expect(result.outer.inner).toBeInstanceOf(Uint8Array);
        expect(result.outer.inner).toEqual(new Uint8Array([10, 20]));
    });

    test('empty Uint8Array does not get lost when nested in object', () => {
        const obj = { a: new Uint8Array(0), b: new Uint8Array([42]) };
        const result = deserialize<typeof obj>(serialize(obj));
        expect(result.a).toBeInstanceOf(Uint8Array);
        expect(result.a.length).toBe(0);
        expect(result.b).toEqual(new Uint8Array([42]));
    });
});

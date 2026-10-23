import type { BlobOnlyApi, NoReservedNamesApi } from './index';
import { SANDBOX_PROTOCOL_VERSION, collectTransferables, isInitMessage } from './index';

describe('isInitMessage', () => {
    const valid = { type: 'sandbox-init', version: SANDBOX_PROTOCOL_VERSION, assets: {} };

    it('accepts an init message at the current version', () => {
        expect(isInitMessage(valid)).toBe(true);
    });

    it('rejects a message from a different protocol version', () => {
        expect(isInitMessage({ ...valid, version: SANDBOX_PROTOCOL_VERSION + 1 })).toBe(false);
        expect(isInitMessage({ ...valid, version: undefined })).toBe(false);
    });

    it('rejects anything that is not an init message', () => {
        expect(isInitMessage({ type: 'something-else', version: SANDBOX_PROTOCOL_VERSION })).toBe(false);
        expect(isInitMessage(null)).toBe(false);
        expect(isInitMessage('sandbox-init')).toBe(false);
    });
});

describe('collectTransferables', () => {
    it('finds a bare transferable', () => {
        const buffer = new ArrayBuffer(8);

        expect(collectTransferables(buffer)).toEqual([buffer]);
    });

    it('finds transferables nested in objects and arrays', () => {
        const first = new ArrayBuffer(8);
        const second = new ArrayBuffer(16);

        expect(collectTransferables({ a: { b: first }, c: [{ d: second }] })).toEqual([first, second]);
    });

    it('unwraps a typed array to the buffer underneath', () => {
        const view = new Uint8Array([1, 2, 3]);

        expect(collectTransferables({ view })).toEqual([view.buffer]);
    });

    it('copies a view that only covers part of its buffer, so the rest is not emptied', () => {
        const view = new Uint8Array([1, 2, 3, 4]).subarray(1, 3);

        expect(collectTransferables({ view })).toEqual([]);
    });

    it('returns nothing for values that are only cloned', () => {
        expect(collectTransferables({ size: 1, name: 'x', nested: { ok: true } })).toEqual([]);
        expect(collectTransferables(undefined)).toEqual([]);
    });

    it('reports each transferable once, even if referenced twice', () => {
        const buffer = new ArrayBuffer(8);

        expect(collectTransferables({ a: buffer, b: buffer })).toEqual([buffer]);
    });

    it('survives a cycle', () => {
        const cyclic: Record<string, unknown> = { buffer: new ArrayBuffer(8) };
        cyclic.self = cyclic;

        expect(collectTransferables(cyclic)).toEqual([cyclic.buffer]);
    });

    it('stops descending eventually, falling back to a copy', () => {
        // Wrap a buffer `levels` objects deep.
        const buried = (levels: number): unknown =>
            Array.from({ length: levels }).reduce<unknown>((inner) => ({ inner }), new ArrayBuffer(8));

        expect(collectTransferables(buried(7))).toHaveLength(1);
        // Past the cap the buffer is simply not found, so it gets copied rather
        // than moved. Slower, never wrong — which is the right way round.
        expect(collectTransferables(buried(8))).toHaveLength(0);
    });

    it('lets an explicit transfer list override what it would have found', () => {
        const found = new ArrayBuffer(8);
        const forced = new ArrayBuffer(16);
        const value = { found };
        const explicit = new WeakMap<object, Transferable[]>([[value, [forced]]]);

        expect(collectTransferables(value, explicit)).toEqual([forced]);
    });
});

// Checked by tsc, not jest: each `@ts-expect-error` fails the type check if the
// line below it stops being an error.
describe('BlobOnlyApi', () => {
    it('accepts Blobs and refuses raw bytes, even nested', () => {
        const takesBlob = { parse: async (file: Blob) => file.size };
        const takesBuffer = { parse: async (file: ArrayBuffer) => file.byteLength };
        const takesNestedView = { parse: async (input: { data: Uint8Array<ArrayBuffer> }) => input.data.length };

        const accepted: BlobOnlyApi<typeof takesBlob> = takesBlob;
        // @ts-expect-error ArrayBuffer must be passed as a Blob
        const refusedBuffer: BlobOnlyApi<typeof takesBuffer> = takesBuffer;
        // @ts-expect-error a typed array inside an object must be passed as a Blob
        const refusedView: BlobOnlyApi<typeof takesNestedView> = takesNestedView;

        expect([accepted, refusedBuffer, refusedView]).toHaveLength(3);
    });
});

describe('NoReservedNamesApi', () => {
    it('accepts ordinary method names and refuses the ones the host answers itself', () => {
        const ordinary = { parse: async (file: Blob) => file.size };
        const reserved = { destroy: async (file: Blob) => file.size };

        const accepted: NoReservedNamesApi<typeof ordinary> = ordinary;
        // @ts-expect-error `destroy` is answered by the host
        const refused: NoReservedNamesApi<typeof reserved> = reserved;

        expect([accepted, refused]).toHaveLength(2);
    });
});

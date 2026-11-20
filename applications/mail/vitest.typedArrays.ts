import { TextDecoder, TextEncoder } from 'node:util';

// jsdom swaps the global typed arrays: restore Node's constructors so OpenPGP's `instanceof Uint8Array` checks pass.
// Imported first by vitest.setup.ts, before anything polyfills them.
const NodeUint8Array = Object.getPrototypeOf(Buffer.prototype).constructor as Uint8ArrayConstructor;

if (globalThis.Uint8Array !== NodeUint8Array) {
    globalThis.Uint8Array = NodeUint8Array;
    globalThis.TextEncoder = TextEncoder as typeof globalThis.TextEncoder;
    globalThis.TextDecoder = TextDecoder as typeof globalThis.TextDecoder;
}

export {};

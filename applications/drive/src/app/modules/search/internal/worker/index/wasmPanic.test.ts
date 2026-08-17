import { Document, Engine, Value } from '@proton/proton-foundation-search';

import { setupRealSearchLibraryWasm } from '../../testing/setupRealSearchLibraryWasm';
import { takeLastWasmPanic } from './wasmPanic';

// Installs the panic capture, like initWasm() does in the worker.
setupRealSearchLibraryWasm();

/**
 * Start a write and step its execution once, leaving the manifest `Load` event unserved. The library
 * documents that calling `next()` again in that state panics, which makes it the one deterministic
 * WASM panic available from the JS side.
 */
function executionWithAnUnservedLoad() {
    const engine = Engine.builder().build();
    const write = engine.write();
    if (!write) {
        throw new Error('wasm panic test: the engine gave no write handle');
    }
    const doc = new Document('doc-1');
    doc.addAttribute('name', Value.text('hello world'));
    write.insert(doc);
    const execution = write.commit();
    execution.next();
    return execution;
}

describe('wasm panic capture', () => {
    afterEach(() => {
        takeLastWasmPanic();
    });

    it('captures the message and location of a Rust panic', () => {
        const execution = executionWithAnUnservedLoad();

        expect(() => execution.next()).toThrow(WebAssembly.RuntimeError);

        const panic = takeLastWasmPanic();
        expect(panic).toContain('panicked at');
        expect(panic).toContain('load event was not handled');
    });

    it('clears the panic once read, so it cannot be attributed to a later error', () => {
        const execution = executionWithAnUnservedLoad();
        expect(() => execution.next()).toThrow(WebAssembly.RuntimeError);

        expect(takeLastWasmPanic()).toBeDefined();
        expect(takeLastWasmPanic()).toBeUndefined();
    });

    it('reports no panic when nothing panicked', () => {
        expect(takeLastWasmPanic()).toBeUndefined();
    });
});

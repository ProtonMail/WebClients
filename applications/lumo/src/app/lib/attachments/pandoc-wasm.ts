/* eslint-disable @typescript-eslint/naming-convention */
// /* eslint-disable @typescript-eslint/ban-ts-comment,@typescript-eslint/no-explicit-any,@typescript-eslint/no-unused-vars,@typescript-eslint/naming-convention */
// // @ts-nocheck
import {ConsoleStdout, File, OpenFile, PreopenDirectory, WASI} from '@bjorn3/browser_wasi_shim';

// import pandocWasmAsset from '../../../assets/pandoc.wasm';

const pandocWasmAsset = new URL('../../assets/pandoc.wasm', import.meta.url).toString();
// const pandocWasmAsset = '/public/pandoc.wasm';

// Add WASM module caching
let cachedWasmModule: WebAssembly.Module | null = null;
async function getWasmModule(): Promise<WebAssembly.Module> {
    if (!cachedWasmModule) {
        const response = await fetch(pandocWasmAsset);

        if (!response.ok) {
            throw new Error(`Failed to fetch pandoc.wasm: ${response.status} ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        cachedWasmModule = await WebAssembly.compile(arrayBuffer);
    }
    return cachedWasmModule;
}

// Memory logging - only enabled when DEBUG_PANDOC_MEMORY is set
const DEBUG_MEMORY = typeof globalThis !== 'undefined' && (globalThis as any).DEBUG_PANDOC_MEMORY === true;

function logMemoryUsage(label: string) {
    if (!DEBUG_MEMORY) return;

    // Simple synchronous logging for debugging
    if (typeof window !== 'undefined' && (window.performance as any)?.memory) {
        const memory = (window.performance as any).memory;
        const used = Math.round(memory.usedJSHeapSize / (1024 * 1024));
        const total = Math.round(memory.totalJSHeapSize / (1024 * 1024));
        console.log(`[Pandoc Memory ${label}] JS Heap: ${used}MB / ${total}MB`);
    }
}

export class PandocConverter {
    wasmInstance: WebAssembly.Instance | undefined;

    inFile: File | undefined;

    outFile: File | undefined;

    ready: Promise<PandocConverter>;

    static instanceCount = 0;

    constructor() {
        PandocConverter.instanceCount++;
        logMemoryUsage('Init Start');

        this.ready = new Promise(async (resolve, reject) => {
            try {
                const args = ['pandoc.wasm', '+RTS', '-H64m', '-RTS'];
                const env: string[] = [];
                this.inFile = new File(new Uint8Array(), { readonly: true });
                this.outFile = new File(new Uint8Array(), { readonly: false });

                const fds = [
                    new OpenFile(new File(new Uint8Array(), { readonly: true })),
                    ConsoleStdout.lineBuffered((msg) => console.log(`[WASI stdout] ${msg}`)),
                    ConsoleStdout.lineBuffered((msg) => console.warn(`[WASI stderr] ${msg}`)),
                    new PreopenDirectory(
                        '/',
                        new Map([
                            ['in', this.inFile],
                            ['out', this.outFile],
                        ])
                    ),
                ];

                const wasi = new WASI(args, env, fds, { debug: false });

                // Use cached WASM module
                const module = await getWasmModule();
                const instance = await WebAssembly.instantiate(module, {
                    wasi_snapshot_preview1: wasi.wasiImport,
                });

                this.wasmInstance = instance;
                // @ts-ignore
                wasi.initialize(instance);
                // @ts-ignore
                instance.exports.__wasm_call_ctors();

                // Initialize memory and arguments
                // @ts-ignore
                const memory_data_view = () => new DataView(instance.exports.memory.buffer);
                // @ts-ignore
                const argc_ptr = instance.exports.malloc(4);
                memory_data_view().setUint32(argc_ptr, args.length, true);
                // @ts-ignore
                const argv = instance.exports.malloc(4 * (args.length + 1));

                for (let i = 0; i < args.length; ++i) {
                    // @ts-ignore
                    const arg = instance.exports.malloc(args[i].length + 1);
                    new TextEncoder().encodeInto(
                        args[i],
                        // @ts-ignore
                        new Uint8Array(instance.exports.memory.buffer, arg, args[i].length)
                    );
                    memory_data_view().setUint8(arg + args[i].length, 0);
                    memory_data_view().setUint32(argv + 4 * i, arg, true);
                }

                memory_data_view().setUint32(argv + 4 * args.length, 0, true);
                // @ts-ignore
                const argv_ptr = instance.exports.malloc(4);
                memory_data_view().setUint32(argv_ptr, argv, true);

                // @ts-ignore
                instance.exports.hs_init_with_rtsopts(argc_ptr, argv_ptr);

                logMemoryUsage('Init Complete');
                resolve(this);
            } catch (e) {
                logMemoryUsage('Init Error');
                reject(e);
            }
        });
    }

    private clearBuffers() {
        if (this.inFile) {
            this.inFile.data = new Uint8Array(0);
        }
        if (this.outFile) {
            this.outFile.data = new Uint8Array(0);
        }
    }

    async cleanup() {
        logMemoryUsage('Cleanup Start');

        if (this.wasmInstance?.exports.hs_exit) {
            // Call Haskell runtime cleanup
            // @ts-ignore
            this.wasmInstance.exports.hs_exit();
        }

        // Clear file buffers
        this.clearBuffers();

        // Clear instance references
        this.wasmInstance = undefined;
        this.inFile = undefined;
        this.outFile = undefined;

        PandocConverter.instanceCount--;

        logMemoryUsage('Cleanup Complete');
    }

    async convert(inputBytes: ArrayBuffer, inputFormat: string = 'html'): Promise<string> {
        try {
            await this.ready;
            if (!this.wasmInstance) throw new Error('Pandoc WASM not initialized');

            // Default arguments for markdown conversion
            const args_str = `-f ${inputFormat} -t markdown`;
            // @ts-ignore
            const args_ptr = this.wasmInstance.exports.malloc(args_str.length);

            try {
                new TextEncoder().encodeInto(
                    args_str,
                    // @ts-ignore
                    new Uint8Array(this.wasmInstance.exports.memory.buffer, args_ptr, args_str.length)
                );

                this.inFile!.data = new Uint8Array(inputBytes);

                // @ts-ignore
                this.wasmInstance.exports.wasm_main(args_ptr, args_str.length);

                return new TextDecoder('utf-8', {fatal: true}).decode(this.outFile!.data);
            } finally {
                // Free the allocated memory for args
                if (this.wasmInstance?.exports.free) {
                    // @ts-ignore
                    this.wasmInstance.exports.free(args_ptr);
                }
                // Clear input/output buffers immediately to free memory
                this.clearBuffers();
            }
        } catch (error) {
            console.error('Error during conversion:', error);
            // Make sure we still cleanup on error
            this.clearBuffers();
            throw error;
        }
    }
}

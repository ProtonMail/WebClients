/* eslint-disable @typescript-eslint/naming-convention */
// /* eslint-disable @typescript-eslint/ban-ts-comment,@typescript-eslint/no-explicit-any,@typescript-eslint/no-unused-vars,@typescript-eslint/naming-convention */
// // @ts-nocheck
import { ConsoleStdout, File, OpenFile, PreopenDirectory, WASI } from '@bjorn3/browser_wasi_shim';

// import pandocWasmAsset from '../../../assets/pandoc.wasm';

const pandocWasmAsset = new URL('../../assets/pandoc.wasm', import.meta.url).toString();
console.log({ pandocWasmAsset });
// const pandocWasmAsset = '/public/pandoc.wasm';

// Add WASM module caching
let cachedWasmModule: WebAssembly.Module | null = null;
async function getWasmModule(): Promise<WebAssembly.Module> {
    if (!cachedWasmModule) {
        const response = await fetch(pandocWasmAsset);
        cachedWasmModule = await WebAssembly.compile(await response.arrayBuffer());
    }
    return cachedWasmModule;
}

// Add memory tracking utilities at the top of the file
async function getDetailedMemoryUsage(): Promise<{
    jsHeapUsed: number;
    jsHeapTotal: number;
    wasmBytes?: number;
    detailedBreakdown?: string;
}> {
    const basic = {
        jsHeapUsed: 0,
        jsHeapTotal: 0,
    };

    // Get basic JS heap measurements
    if (typeof window !== 'undefined' && (window.performance as any)?.memory) {
        const memory = (window.performance as any).memory;
        basic.jsHeapUsed = Math.round(memory.usedJSHeapSize / (1024 * 1024));
        basic.jsHeapTotal = Math.round(memory.totalJSHeapSize / (1024 * 1024));
    }

    // Get detailed memory measurements including WASM
    if (typeof performance !== 'undefined' && (performance as any).measureUserAgentSpecificMemory) {
        try {
            const measurement = await (performance as any).measureUserAgentSpecificMemory();
            let wasmTotal = 0;
            const breakdown = [];

            for (const entry of measurement.breakdown) {
                if (entry.types.includes('wasm')) {
                    wasmTotal += entry.bytes;
                }
                breakdown.push(`${entry.types.join('+')}:${Math.round(entry.bytes / (1024 * 1024))}MB`);
            }

            return {
                ...basic,
                wasmBytes: Math.round(wasmTotal / (1024 * 1024)),
                detailedBreakdown: breakdown.join(', '),
            };
        } catch (e) {
            console.warn('Failed to measure detailed memory:', e);
        }
    }

    return basic;
}

async function logMemoryUsage(label: string) {
    const memory = await getDetailedMemoryUsage();
    let message = `[Memory ${label}] JS Heap Used: ${memory.jsHeapUsed}MB, Total: ${memory.jsHeapTotal}MB`;

    if (memory.wasmBytes !== undefined) {
        message += `, WASM: ${memory.wasmBytes}MB`;
    }
    if (memory.detailedBreakdown) {
        message += `\n  Breakdown: ${memory.detailedBreakdown}`;
    }

    console.log(message);
}

export class PandocConverter {
    wasmInstance: WebAssembly.Instance | undefined;

    inFile: File | undefined;

    outFile: File | undefined;

    ready: Promise<PandocConverter>;

    static instanceCount = 0;

    constructor() {
        PandocConverter.instanceCount++;
        console.log(`[PandocConverter] Creating instance #${PandocConverter.instanceCount}`);

        void logMemoryUsage('Before PandocConverter Init');

        this.ready = new Promise(async (resolve, reject) => {
            try {
                console.log('initPandocWasm: starting');
                await logMemoryUsage('Before WASM Args Setup');

                const args = ['pandoc.wasm', '+RTS', '-H64m', '-RTS'];
                const env: string[] = [];
                this.inFile = new File(new Uint8Array(), { readonly: true });
                this.outFile = new File(new Uint8Array(), { readonly: false });

                await logMemoryUsage('Before WASI Setup');

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
                await logMemoryUsage('Before WASM Instantiation');

                // Use cached WASM module
                const module = await getWasmModule();
                const instance = await WebAssembly.instantiate(module, {
                    wasi_snapshot_preview1: wasi.wasiImport,
                });

                await logMemoryUsage('After WASM Instantiation');

                this.wasmInstance = instance;
                // @ts-ignore
                wasi.initialize(instance);
                // @ts-ignore
                instance.exports.__wasm_call_ctors();

                await logMemoryUsage('Before Memory Setup');

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

                await logMemoryUsage('Before hs_init');

                // @ts-ignore
                instance.exports.hs_init_with_rtsopts(argc_ptr, argv_ptr);

                await logMemoryUsage('After Complete Init');

                resolve(this);
            } catch (e) {
                await logMemoryUsage('On Init Error');
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
        await logMemoryUsage('Before Cleanup');

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

        await logMemoryUsage('After Cleanup');
    }

    async convert(inputBytes: ArrayBuffer, inputFormat: string = 'html'): Promise<string> {
        try {
            await logMemoryUsage('Before Convert');

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

                await logMemoryUsage('Before WASM Main Call');

                // @ts-ignore
                this.wasmInstance.exports.wasm_main(args_ptr, args_str.length);

                await logMemoryUsage('After WASM Main Call');

                const output = new TextDecoder('utf-8', { fatal: true }).decode(this.outFile!.data);

                await logMemoryUsage('After Convert Complete');

                return output;
            } finally {
                // Free the allocated memory for args
                if (this.wasmInstance?.exports.free) {
                    // @ts-ignore
                    this.wasmInstance.exports.free(args_ptr);
                }
                // Clear input/output buffers
                this.clearBuffers();

                await logMemoryUsage('After Convert Cleanup');
            }
        } catch (error) {
            console.error('Error during conversion:', error);
            // Make sure we still cleanup on error
            this.clearBuffers();
            throw error;
        }
    }
}

export default function wasmWorkerWrapper() {
    return new Worker(new URL('./wasmWorker.ts', import.meta.url));
}

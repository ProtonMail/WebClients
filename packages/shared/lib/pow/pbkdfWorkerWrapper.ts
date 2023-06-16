export default function pbkdfWorkerWrapper() {
    return new Worker(new URL('./pbkdfWorker.ts', import.meta.url));
}

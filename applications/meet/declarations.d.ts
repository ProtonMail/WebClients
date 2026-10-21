declare module '*.worker.ts' {
    class WebpackWorker extends Worker {
        constructor();
    }
    export default WebpackWorker;
}

declare module '*.gif' {
    const src: string;
    export default src;
}

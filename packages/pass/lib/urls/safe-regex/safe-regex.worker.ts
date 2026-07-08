type WorkerRequest = {
    regex: string;
    values: string[];
};

export type WorkerResponse = {
    elapsed?: number;
    error?: string;
};

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
    const { regex, values } = e.data;
    try {
        const re = new RegExp(regex);
        const start = performance.now();
        for (const value of values) {
            re.test(value);
        }
        const elapsed = performance.now() - start;
        self.postMessage({ elapsed } satisfies WorkerResponse);
    } catch (error) {
        self.postMessage({ error: String(error) } satisfies WorkerResponse);
    }
};

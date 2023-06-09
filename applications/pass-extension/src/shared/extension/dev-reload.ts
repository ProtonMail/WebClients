/**
 * Allows triggering custom callback function when the
 * ProtonPassExtensionReloader webpack plugin sends a
 * "reload" message.
 */

export const createDevReloader = (cb: () => void, description: string) => {
    if (RUNTIME_RELOAD) {
        const socket = new WebSocket(`wss://localhost:9090`);

        socket.addEventListener('message', ({ data }: MessageEvent) => {
            const message = JSON.parse(data);

            if (message.reload) {
                console.info(`[ProtonPassExtensionReloader] - ${description}`);
                cb();
            }
        });

        socket.addEventListener('error', () =>
            console.info('[ProtonPassExtensionReloader] - Error while communicating with WS server')
        );
    }
};

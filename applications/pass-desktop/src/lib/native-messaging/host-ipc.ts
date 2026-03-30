import { unlink } from 'node:fs/promises';
import type { Server } from 'node:net';
import { type Socket, createServer } from 'node:net';
import { platform } from 'node:os';

import type { MaybeNull, NativeMessagePayload, NativeMessageRequest, NativeMessageResponse } from '@proton/pass/types';
import { wait } from '@proton/shared/lib/helpers/promise';

import logger from '../../utils/logger';

const RECONNECT_DELAY_MS = 2_000;
const MAX_RECONNECT_ATTEMPTS = 10;

const log = (...content: any[]) => logger.debug('[NativeMessaging] IPC', ...content);

type ServerHandle = {
    server: Server;
    close: () => Promise<void>;
};

async function startServer({
    sockLocation,
    onStart,
    onMessage,
    onClose,
}: {
    sockLocation: string;
    onStart: (sock: Socket) => void;
    onMessage: (sock: Socket, payload: Buffer) => void;
    onClose: (sock: Socket) => void;
}): Promise<ServerHandle> {
    const server = createServer((sock) => {
        log('sock connected');
        onStart(sock);

        sock.on('data', (buf) => onMessage(sock, buf));
        sock.on('close', (hadError) => {
            log('sock closed', ...(hadError ? ['with error'] : []));
            onClose(sock);
        });
        sock.on('error', (err) => log('sock error', err));
    });

    server.on('error', (err) => log('server error', err));

    await new Promise<void>((resolve, reject) => {
        server.listen(sockLocation, () => {
            log('server listening');
            resolve();
        });
        server.once('error', reject);
    });

    // Graceful close helper
    const close = async () => {
        return new Promise<void>((res) => {
            server.close(() => {
                log('server stopped');
                if (platform() !== 'win32') {
                    unlink(sockLocation).catch(() => {});
                }
                res();
            });
        });
    };

    return { server, close };
}

type HostSockLoop = (options: {
    sockLocation: string;
    onMessage: (
        request: NativeMessagePayload<NativeMessageRequest>,
        sendResponse: (response: NativeMessagePayload<NativeMessageResponse>) => void
    ) => void;
}) => () => Promise<void>;

export const hostSockLoop: HostSockLoop = ({ sockLocation, onMessage }) => {
    let shuttingDown = false;
    let serverHandle: MaybeNull<ServerHandle> = null;
    const sockets = new Set<Socket>();
    let reconnectAttempts = 0;

    const onStart = (sock: Socket) => sockets.add(sock);
    const onClose = (sock: Socket) => sockets.delete(sock);

    // On host message, parse json and call callback
    const handleMessage = (socket: Socket, buffer: Buffer) => {
        try {
            // Send response to the current socket
            const sendResponse = (response: NativeMessagePayload<NativeMessageResponse>) => {
                try {
                    log('response', response.type);
                    socket.write(JSON.stringify(response) + '\n');
                } catch (error) {
                    log('receive from window went wrong', error);
                }
            };

            onMessage(JSON.parse(buffer.toString()) as NativeMessagePayload<NativeMessageRequest>, sendResponse);
        } catch (error) {
            log('failed parsing message', error);
        }
    };

    // Main loop on server creation with delay and max attempts
    const loop = async () => {
        while (!shuttingDown) {
            try {
                const newServerHandle = await startServer({ sockLocation, onStart, onClose, onMessage: handleMessage });
                serverHandle = newServerHandle;
                reconnectAttempts = 0;
                await new Promise<void>((resolve) => newServerHandle?.server.once('close', resolve));
            } catch (err) {
                reconnectAttempts += 1;
                log(`failed to start server (attempt ${reconnectAttempts})`, err);

                if (MAX_RECONNECT_ATTEMPTS && reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
                    log('max reconnect attempts reached, giving up');
                    break;
                }

                await wait(RECONNECT_DELAY_MS);
            }
        }
    };

    // Actually start the main connection loop
    void loop();

    // Shutdown helper, close the server and the socket, stop the reconnect loop
    return async () => {
        shuttingDown = true;
        log('shutting down...');
        sockets.forEach((sock) => sock.end(() => sock.destroy()));
        sockets.clear();
        await serverHandle?.close();
    };
};

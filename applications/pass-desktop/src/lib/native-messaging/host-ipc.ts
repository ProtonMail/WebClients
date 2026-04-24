import type { LogLevel } from 'electron-log';
import { unlink } from 'node:fs/promises';
import type { Server } from 'node:net';
import { type Socket, createServer } from 'node:net';
import { isWindows } from 'proton-pass-desktop/utils/platform';

import type { MaybeNull, NativeMessagePayload, NativeMessageRequest, NativeMessageResponse } from '@proton/pass/types';
import { wait } from '@proton/shared/lib/helpers/promise';
import noop from '@proton/utils/noop';

import logger from '../../utils/logger';

const RECONNECT_DELAY_MS = 2_000;

const log =
    (level: LogLevel) =>
    (...content: any[]) =>
        logger[level]('[NativeMessaging] IPC', ...content);
const debug = log('debug');
const info = log('info');
const warn = log('warn');

const clearSocketFile = async (sockLocation: string) => {
    if (!isWindows) return unlink(sockLocation).catch(noop);
};

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
        debug('sock connected');
        onStart(sock);

        sock.on('data', (buf) => onMessage(sock, buf));
        sock.on('close', (hadError) => {
            debug('sock closed', ...(hadError ? ['with error'] : []));
            onClose(sock);
        });
        sock.on('error', (err) => debug('sock error', err));
    });

    server.on('error', (err) => warn('server error', err));

    await new Promise<void>((resolve, reject) => {
        server.listen(sockLocation, () => {
            info('server listening');
            resolve();
        });
        server.once('error', reject);
    });

    // Graceful close helper
    const close = async () => {
        return new Promise<void>((res) => {
            server.close(async () => {
                debug('server stopped');
                await clearSocketFile(sockLocation);
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
                    debug('response', response.type);
                    socket.write(JSON.stringify(response) + '\n');
                } catch (error) {
                    debug('receive from window went wrong', error);
                }
            };

            onMessage(JSON.parse(buffer.toString()) as NativeMessagePayload<NativeMessageRequest>, sendResponse);
        } catch (error) {
            debug('failed parsing message', error);
        }
    };

    // Main loop on server creation with delay and unlimited retries
    const loop = async () => {
        while (!shuttingDown) {
            try {
                await clearSocketFile(sockLocation);
                const newServerHandle = await startServer({ sockLocation, onStart, onClose, onMessage: handleMessage });
                serverHandle = newServerHandle;
                reconnectAttempts = 0;
                await new Promise<void>((resolve) => newServerHandle?.server.once('close', resolve));
            } catch (err) {
                reconnectAttempts += 1;
                warn(`failed to start server (attempt ${reconnectAttempts})`, err);
                await wait(RECONNECT_DELAY_MS);
            }
        }
    };

    // Actually start the main connection loop
    void loop();

    // Shutdown helper, close the server and the socket, stop the reconnect loop
    return async () => {
        shuttingDown = true;
        debug('shutting down...');
        sockets.forEach((sock) => sock.end(() => sock.destroy()));
        sockets.clear();
        await serverHandle?.close();
    };
};

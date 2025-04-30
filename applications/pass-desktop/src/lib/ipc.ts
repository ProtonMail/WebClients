import { type IpcMainInvokeEvent, ipcMain } from 'electron';

import type { MaybePromise, Result } from '@proton/pass/types';

export type IPCChannel<P extends any[], R extends any> = { args: P; result: R };
export type IPCChannelResult<T> = Result<{ result: T }>;
export interface IPCChannels {}

/** Wraps `ipcMain.handle` to avoid handler errors from bubbling up
 * to the handle() call, which will in turn serialize them into a string
 * prepended with "Error occurred in handler for HANDLER_NAME: Error message".
 * Instead, to have a bit more control over these, we'll return a `Result`
 * type to properly report any errors thrown by the handler. */
export const setupIpcHandler = <
    T extends keyof IPCChannels,
    P extends IPCChannels[T]['args'],
    R extends IPCChannels[T]['result'],
>(
    channel: T,
    handler: (event: IpcMainInvokeEvent, ...args: P) => MaybePromise<R>
) =>
    ipcMain.handle(channel, async (event, ...args: P): Promise<IPCChannelResult<R>> => {
        try {
            const result = await handler(event, ...args);
            return { ok: true, result };
        } catch (err: any) {
            let error = 'Unknown error';
            if (typeof err === 'string') error = err;
            if (typeof err?.message === 'string') error = err.message;

            return { ok: false, error };
        }
    });

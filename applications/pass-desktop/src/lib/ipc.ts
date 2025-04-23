import { ipcMain } from 'electron';

// Wraps `ipcMain.handle` to avoid handler errors from bubbling up
// to the handle() call, which will in turn serialize them into a string
// prepended with "Error occurred in handler for HANDLER_NAME: Error message"
//
// Instead, to have a bit more control over these, we'll return a
// { error: { message: string } } object if an error gets thrown by the handler,
// or a { result: any } object if it complets successfully.
export const setupIpcHandler = (method: string, handler: (...args: any[]) => Promise<any> | any) =>
    ipcMain.handle(method, async (...args) => {
        try {
            const result = await handler(...args);
            return { result };
        } catch (err: any) {
            let message = 'Unknown error';
            if (typeof err === 'string') message = err;
            if (typeof err?.message === 'string') message = err.message;

            return {
                error: { message },
            };
        }
    });

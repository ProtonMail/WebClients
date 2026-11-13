import { logger } from '@protontech/logger';

import * as WasmModule from '@proton/andromeda';

import { installWasmPanicCapture } from './wasmPanic';

describe('installWasmPanicCapture', () => {
    it('should forward andromeda panics to the logger and keep printing to the console', () => {
        const setPanicHookSpy = vi.spyOn(WasmModule, 'setPanicHook').mockImplementation(() => {});
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const loggerErrorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});

        installWasmPanicCapture();
        installWasmPanicCapture();
        expect(setPanicHookSpy).toHaveBeenCalledTimes(1);

        const panic = 'panicked at src/account.rs:12:5:\nindex out of bounds\n\nStack:\n\nError\n    at shim';
        // eslint-disable-next-line no-console
        console.error(panic);
        expect(loggerErrorSpy).toHaveBeenCalledWith(
            'Andromeda WASM panic: panicked at src/account.rs:12:5: index out of bounds'
        );
        expect(consoleErrorSpy).toHaveBeenCalledWith(panic);

        loggerErrorSpy.mockClear();
        // eslint-disable-next-line no-console
        console.error('unrelated error');
        expect(loggerErrorSpy).not.toHaveBeenCalled();
        expect(consoleErrorSpy).toHaveBeenCalledWith('unrelated error');
    });
});

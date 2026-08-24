import * as PassUIRustWorker from '@protontech/pass-rust-core/ui';

import { getErrorMessage } from '../../utils/errors/get-error-message';
import { WASM_WORKER_READY_EVENT } from './constants';
import type { PassUIMessageEvent, PassUIMethod, PassUIRPC, PassUIResult } from './ui.types';

self.postMessage({ type: WASM_WORKER_READY_EVENT });

self.onmessage = ({ data: { method, args }, ports }: MessageEvent<PassUIRPC<PassUIMethod>>) => {
    const port = ports?.[0];

    if (port) {
        port.postMessage(
            ((): PassUIMessageEvent<PassUIMethod> => {
                try {
                    const value = (PassUIRustWorker[method] as any)(...args) as PassUIResult<PassUIMethod>;
                    return { ok: true, value };
                } catch (err) {
                    return { ok: false, error: getErrorMessage(err) };
                }
            })()
        );
    }
};

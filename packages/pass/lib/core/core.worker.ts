import * as PassRustWorker from '@protontech/pass-rust-core/worker';

import { getErrorMessage } from '../../utils/errors/get-error-message';
import { WASM_WORKER_READY_EVENT } from './constants';
import type { PassCoreMessageEvent, PassCoreMethod, PassCoreRPC, PassCoreResult } from './core.types';

self.postMessage({ type: WASM_WORKER_READY_EVENT });

self.onmessage = ({ data: { method, args }, ports }: MessageEvent<PassCoreRPC<PassCoreMethod>>) => {
    const port = ports?.[0];

    if (port) {
        port.postMessage(
            ((): PassCoreMessageEvent<PassCoreMethod> => {
                try {
                    const value = (PassRustWorker[method] as any)(...args) as PassCoreResult<PassCoreMethod>;
                    return { ok: true, value };
                } catch (err) {
                    return { ok: false, error: getErrorMessage(err) };
                }
            })()
        );
    }
};

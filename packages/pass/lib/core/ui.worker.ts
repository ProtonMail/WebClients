import * as PassUIRustWorker from '@protontech/pass-rust-core/ui';

import { WASM_WORKER_READY_EVENT } from '@proton/pass/lib/core/constants';
import type { PassUIMessageEvent, PassUIMethod, PassUIRPC, PassUIResult } from '@proton/pass/lib/core/ui.types';
import { getErrorMessage } from '@proton/pass/utils/errors/get-error-message';

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

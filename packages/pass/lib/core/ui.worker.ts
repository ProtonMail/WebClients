import * as PassUIRustWorker from '@protontech/pass-rust-core/ui';

import { WASM_WORKER_READY_EVENT } from '@proton/pass/lib/core/constants';
import type { PassUIMethod, PassUIRPC } from '@proton/pass/lib/core/ui.types';

self.postMessage({ type: WASM_WORKER_READY_EVENT });

self.onmessage = ({ data: { method, args }, ports }: MessageEvent<PassUIRPC<PassUIMethod>>) => {
    const port = ports?.[0];
    if (port) port.postMessage((PassUIRustWorker[method] as any)(...args));
};

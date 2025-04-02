import * as PassRustWorker from '@protontech/pass-rust-core/worker';

import { WASM_WORKER_READY_EVENT } from '@proton/pass/lib/core/constants';

import type { PassCoreMethod, PassCoreRPC } from './core.types';

self.postMessage({ type: WASM_WORKER_READY_EVENT });

self.onmessage = ({ data: { method, args }, ports }: MessageEvent<PassCoreRPC<PassCoreMethod>>) => {
    const port = ports?.[0];
    if (port) port.postMessage((PassRustWorker[method] as any)(...args));
};

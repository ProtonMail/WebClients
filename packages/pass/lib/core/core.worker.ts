import * as PassRustCore from '@protontech/pass-rust-core';

import type { PassCoreMethod, PassCoreRPC } from './types';

/** Handles incoming PassCoreRPC messages to execute functions
 * from the PassRustCore WebAssembly module */
self.onmessage = ({ data: { method, args }, ports }: MessageEvent<PassCoreRPC<PassCoreMethod>>) => {
    const port = ports?.[0];
    if (port) port.postMessage((PassRustCore[method] as any)(...args));
};

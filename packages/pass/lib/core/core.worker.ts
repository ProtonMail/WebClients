import * as PassRustCore from '@protontech/pass-rust-core';

import type { PassCoreMethod, PassCoreRPC } from './types';

/** Acts as a proxy to the PassRustCore WebAssembly module,
 * enabling execution of functions via PassCoreRPC messages */
self.onmessage = ({ data: { method, args }, ports }: MessageEvent<PassCoreRPC<PassCoreMethod>>) => {
    const port = ports?.[0];
    if (port) port.postMessage((PassRustCore[method] as any)(...args));
};

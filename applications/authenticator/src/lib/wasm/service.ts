import type { WasmIssuerMapper } from '@protontech/authenticator-rust-core/worker';

let service: Awaited<ReturnType<typeof getService>>;
let issuerService: WasmIssuerMapper;

const getService = () => import('@protontech/authenticator-rust-core/worker');

export const loadWasm = async () => {
    if (service) return;
    service = await getService();
    issuerService = new service.WasmIssuerMapper();
};

export { issuerService, service };

import type { WasmGatewayProvider } from 'andromeda-wasm';

export const getGatewayNameByGatewayProvider = (provider?: WasmGatewayProvider): string => {
    switch (provider) {
        case 'Banxa':
            return 'Banxa';
        case 'MoonPay':
            return 'MoonPay';
        case 'Ramp':
            return 'Ramp Network';
        default:
            return 'Unsupported';
    }
};

import { WasmScriptType } from '@proton/andromeda';

export const SATOSHI = 1;
export const BITCOIN = 100000000 * SATOSHI;
export const mBITCOIN = BITCOIN / 1000;

export const DEFAULT_INDEX = 0;

export const DEFAULT_ACCOUNT_LABEL = 'Standard';
export const DEFAULT_SCRIPT_TYPE = WasmScriptType.NativeSegwit;

export const SCRIPT_TYPES = [
    WasmScriptType.Legacy,
    WasmScriptType.NestedSegwit,
    WasmScriptType.NativeSegwit,
    WasmScriptType.Taproot,
];

export const purposeByScriptType: Record<WasmScriptType, number> = {
    [WasmScriptType.Legacy]: 44,
    [WasmScriptType.NestedSegwit]: 48,
    [WasmScriptType.NativeSegwit]: 84,
    [WasmScriptType.Taproot]: 86,
};

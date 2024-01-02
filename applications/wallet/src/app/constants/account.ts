import { WasmSupportedBIPs } from '../../pkg';
import { ScriptType } from '../types';

export const scriptTypeToBip: Record<ScriptType, WasmSupportedBIPs> = {
    [ScriptType.Legacy]: WasmSupportedBIPs.Bip44,
    [ScriptType.NestedSegwit]: WasmSupportedBIPs.Bip49,
    [ScriptType.NativeSegwit]: WasmSupportedBIPs.Bip84,
    [ScriptType.Taproot]: WasmSupportedBIPs.Bip86,
};

import { WasmBitcoinUnit, WasmScriptType, WasmWordCount } from '@proton/andromeda';

export const SATOSHI = 1;
export const BITCOIN = 100000000 * SATOSHI;
export const mBITCOIN = BITCOIN / 1000;

export const DEFAULT_INDEX = 0;

/**
 * Bitcoin unit used for amount compute
 */
export const COMPUTE_BITCOIN_UNIT: WasmBitcoinUnit = 'SATS';
/**
 * Default bitcoin to be displayed to the user
 */
export const DEFAULT_DISPLAY_BITCOIN_UNIT: WasmBitcoinUnit = 'BTC';

export const DEFAULT_FIAT_CURRENCY = 'USD';

export const DEFAULT_ACCOUNT_LABEL = 'Primary Account';
export const DEFAULT_SCRIPT_TYPE = WasmScriptType.NativeSegwit;

export const BASE_INDEX_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 'custom'];

export const SCRIPT_TYPES = [
    WasmScriptType.Legacy,
    WasmScriptType.NestedSegwit,
    WasmScriptType.NativeSegwit,
    WasmScriptType.Taproot,
];

export const MIN_FEE_RATE = 1;

export const DEFAULT_TARGET_BLOCK = 5;
export const MAX_BLOCK_TARGET = 25;

export const AVERAGE_TIMEGAP_BETWEEN_BLOCKS = 10;

export const BITCOIN_ADDRESS_INDEX_GAP_BEFORE_WARNING = 10;

export const wordCountToNumber: Record<WasmWordCount, number> = {
    [WasmWordCount.Words12]: 12,
    [WasmWordCount.Words15]: 15,
    [WasmWordCount.Words18]: 18,
    [WasmWordCount.Words21]: 21,
    [WasmWordCount.Words24]: 24,
};

export const FIRST_INDEX = 0;

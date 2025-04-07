let wasm;
export function __wbg_set_wasm(val) {
    wasm = val;
}


const lTextDecoder = typeof TextDecoder === 'undefined' ? (0, module.require)('util').TextDecoder : TextDecoder;

let cachedTextDecoder = new lTextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

let cachedUint8ArrayMemory0 = null;

function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_export_2.set(idx, obj);
    return idx;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}

let WASM_VECTOR_LEN = 0;

const lTextEncoder = typeof TextEncoder === 'undefined' ? (0, module.require)('util').TextEncoder : TextEncoder;

let cachedTextEncoder = new lTextEncoder('utf-8');

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

let cachedDataViewMemory0 = null;

function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

const CLOSURE_DTORS = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(state => {
    wasm.__wbindgen_export_6.get(state.dtor)(state.a, state.b)
});

function makeMutClosure(arg0, arg1, dtor, f) {
    const state = { a: arg0, b: arg1, cnt: 1, dtor };
    const real = (...args) => {
        // First up with a closure we increment the internal reference
        // count. This ensures that the Rust closure environment won't
        // be deallocated while we're invoking it.
        state.cnt++;
        const a = state.a;
        state.a = 0;
        try {
            return f(a, state.b, ...args);
        } finally {
            if (--state.cnt === 0) {
                wasm.__wbindgen_export_6.get(state.dtor)(a, state.b);
                CLOSURE_DTORS.unregister(state);
            } else {
                state.a = a;
            }
        }
    };
    real.original = state;
    CLOSURE_DTORS.register(real, state, state);
    return real;
}

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches && builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
}

function getArrayJsValueFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    const mem = getDataViewMemory0();
    const result = [];
    for (let i = ptr; i < ptr + 4 * len; i += 4) {
        result.push(wasm.__wbindgen_export_2.get(mem.getUint32(i, true)));
    }
    wasm.__externref_drop_slice(ptr, len);
    return result;
}

function passArrayJsValueToWasm0(array, malloc) {
    const ptr = malloc(array.length * 4, 4) >>> 0;
    for (let i = 0; i < array.length; i++) {
        const add = addToExternrefTable0(array[i]);
        getDataViewMemory0().setUint32(ptr + 4 * i, add, true);
    }
    WASM_VECTOR_LEN = array.length;
    return ptr;
}

export function setPanicHook() {
    wasm.setPanicHook();
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_export_2.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}
/**
 * @param {WasmPsbt} psbt
 * @param {WasmAccount} account
 * @returns {Promise<WasmTransactionDetailsData>}
 */
export function createTransactionFromPsbt(psbt, account) {
    _assertClass(psbt, WasmPsbt);
    _assertClass(account, WasmAccount);
    const ret = wasm.createTransactionFromPsbt(psbt.__wbg_ptr, account.__wbg_ptr);
    return ret;
}

/**
 * @param {string} word_start
 * @returns {string[]}
 */
export function getWordsAutocomplete(word_start) {
    const ptr0 = passStringToWasm0(word_start, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.getWordsAutocomplete(ptr0, len0);
    var v2 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    return v2;
}

/**
 * @returns {number}
 */
export function getDefaultStopGap() {
    const ret = wasm.getDefaultStopGap();
    return ret >>> 0;
}

function __wbg_adapter_40(arg0, arg1, arg2) {
    wasm.closure2027_externref_shim(arg0, arg1, arg2);
}

function __wbg_adapter_43(arg0, arg1) {
    wasm._dyn_core__ops__function__FnMut_____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h03753a26d58729d5(arg0, arg1);
}

function __wbg_adapter_661(arg0, arg1, arg2, arg3) {
    wasm.closure2132_externref_shim(arg0, arg1, arg2, arg3);
}

/**
 * @enum {0 | 1 | 2}
 */
export const WasmChangeSpendPolicy = Object.freeze({
    ChangeAllowed: 0, "0": "ChangeAllowed",
    OnlyChange: 1, "1": "OnlyChange",
    ChangeForbidden: 2, "2": "ChangeForbidden",
});
/**
 * @enum {0 | 1 | 2 | 3}
 */
export const WasmCoinSelection = Object.freeze({
    BranchAndBound: 0, "0": "BranchAndBound",
    LargestFirst: 1, "1": "LargestFirst",
    OldestFirst: 2, "2": "OldestFirst",
    Manual: 3, "3": "Manual",
});
/**
 * @enum {0 | 1}
 */
export const WasmKeychainKind = Object.freeze({
    /**
     * External keychain, used for deriving recipient addresses.
     */
    External: 0, "0": "External",
    /**
     * Internal keychain, used for deriving change addresses.
     */
    Internal: 1, "1": "Internal",
});
/**
 * @enum {0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}
 */
export const WasmLanguage = Object.freeze({
    English: 0, "0": "English",
    SimplifiedChinese: 1, "1": "SimplifiedChinese",
    TraditionalChinese: 2, "2": "TraditionalChinese",
    Czech: 3, "3": "Czech",
    French: 4, "4": "French",
    Italian: 5, "5": "Italian",
    Japanese: 6, "6": "Japanese",
    Korean: 7, "7": "Korean",
    Spanish: 8, "8": "Spanish",
});
/**
 * @enum {0 | 1 | 2 | 3}
 */
export const WasmNetwork = Object.freeze({
    /**
     * Mainnet Bitcoin.
     */
    Bitcoin: 0, "0": "Bitcoin",
    /**
     * Bitcoin's testnet network.
     */
    Testnet: 1, "1": "Testnet",
    /**
     * Bitcoin's signet network.
     */
    Signet: 2, "2": "Signet",
    /**
     * Bitcoin's regtest network.
     */
    Regtest: 3, "3": "Regtest",
});
/**
 * @enum {0 | 1 | 2 | 3}
 */
export const WasmPaymentLinkKind = Object.freeze({
    BitcoinAddress: 0, "0": "BitcoinAddress",
    BitcoinURI: 1, "1": "BitcoinURI",
    LightningURI: 2, "2": "LightningURI",
    UnifiedURI: 3, "3": "UnifiedURI",
});
/**
 * @enum {1 | 2 | 3 | 4}
 */
export const WasmScriptType = Object.freeze({
    Legacy: 1, "1": "Legacy",
    NestedSegwit: 2, "2": "NestedSegwit",
    NativeSegwit: 3, "3": "NativeSegwit",
    Taproot: 4, "4": "Taproot",
});
/**
 * @enum {1 | 2}
 */
export const WasmSigningType = Object.freeze({
    Electrum: 1, "1": "Electrum",
    Bip137: 2, "2": "Bip137",
});
/**
 * @enum {0 | 1}
 */
export const WasmSortOrder = Object.freeze({
    Asc: 0, "0": "Asc",
    Desc: 1, "1": "Desc",
});
/**
 * @enum {0 | 1}
 */
export const WasmWalletTransactionFlag = Object.freeze({
    Suspicious: 0, "0": "Suspicious",
    Private: 1, "1": "Private",
});
/**
 * @enum {0 | 1 | 2 | 3 | 4}
 */
export const WasmWordCount = Object.freeze({
    Words12: 0, "0": "Words12",
    Words15: 1, "1": "Words15",
    Words18: 2, "2": "Words18",
    Words21: 3, "3": "Words21",
    Words24: 4, "4": "Words24",
});

const __wbindgen_enum_RequestCredentials = ["omit", "same-origin", "include"];

const __wbindgen_enum_RequestMode = ["same-origin", "no-cors", "cors", "navigate"];

const WasmAccountFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmaccount_free(ptr >>> 0, 1));

export class WasmAccount {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmAccount.prototype);
        obj.__wbg_ptr = ptr;
        WasmAccountFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmAccountFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmaccount_free(ptr, 0);
    }
    /**
     * @param {WasmWallet} wallet
     * @param {WasmScriptType} script_type
     * @param {WasmDerivationPath} derivation_path
     */
    constructor(wallet, script_type, derivation_path) {
        _assertClass(wallet, WasmWallet);
        _assertClass(derivation_path, WasmDerivationPath);
        var ptr0 = derivation_path.__destroy_into_raw();
        const ret = wasm.wasmaccount_new(wallet.__wbg_ptr, script_type, ptr0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0] >>> 0;
        WasmAccountFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {number} from
     * @param {number | null} [to]
     * @returns {Promise<void>}
     */
    markReceiveAddressesUsedTo(from, to) {
        const ret = wasm.wasmaccount_markReceiveAddressesUsedTo(this.__wbg_ptr, from, isLikeNone(to) ? 0x100000001 : (to) >>> 0);
        return ret;
    }
    /**
     * @returns {Promise<WasmAddressInfo>}
     */
    getNextReceiveAddress() {
        const ret = wasm.wasmaccount_getNextReceiveAddress(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} index
     * @returns {Promise<WasmAddressInfo>}
     */
    peekReceiveAddress(index) {
        const ret = wasm.wasmaccount_peekReceiveAddress(this.__wbg_ptr, index);
        return ret;
    }
    /**
     * @param {WasmAddress} address
     * @returns {Promise<boolean>}
     */
    owns(address) {
        _assertClass(address, WasmAddress);
        const ret = wasm.wasmaccount_owns(this.__wbg_ptr, address.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {Promise<WasmBalanceWrapper>}
     */
    getBalance() {
        const ret = wasm.wasmaccount_getBalance(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {string}
     */
    getDerivationPath() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.wasmaccount_getDerivationPath(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * @returns {Promise<WasmUtxoArray>}
     */
    getUtxos() {
        const ret = wasm.wasmaccount_getUtxos(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {WasmNetwork} network
     * @param {string} address_str
     * @param {WasmBlockchainClient} client
     * @param {boolean | null} [force_sync]
     * @returns {Promise<WasmAddressDetailsData | undefined>}
     */
    getAddress(network, address_str, client, force_sync) {
        const ptr0 = passStringToWasm0(address_str, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        _assertClass(client, WasmBlockchainClient);
        const ret = wasm.wasmaccount_getAddress(this.__wbg_ptr, network, ptr0, len0, client.__wbg_ptr, isLikeNone(force_sync) ? 0xFFFFFF : force_sync ? 1 : 0);
        return ret;
    }
    /**
     * @param {WasmPagination} pagination
     * @param {WasmBlockchainClient} client
     * @param {WasmKeychainKind} keychain
     * @param {boolean | null} [force_sync]
     * @returns {Promise<WasmAddressDetailsArray>}
     */
    getAddresses(pagination, client, keychain, force_sync) {
        _assertClass(client, WasmBlockchainClient);
        const ret = wasm.wasmaccount_getAddresses(this.__wbg_ptr, pagination, client.__wbg_ptr, keychain, isLikeNone(force_sync) ? 0xFFFFFF : force_sync ? 1 : 0);
        return ret;
    }
    /**
     * @param {WasmKeychainKind} keychain
     * @returns {Promise<number | undefined>}
     */
    getHighestUsedAddressIndexInOutput(keychain) {
        const ret = wasm.wasmaccount_getHighestUsedAddressIndexInOutput(this.__wbg_ptr, keychain);
        return ret;
    }
    /**
     * @param {WasmPagination} pagination
     * @param {WasmSortOrder | null} [sort]
     * @returns {Promise<WasmTransactionDetailsArray>}
     */
    getTransactions(pagination, sort) {
        const ret = wasm.wasmaccount_getTransactions(this.__wbg_ptr, pagination, isLikeNone(sort) ? 2 : sort);
        return ret;
    }
    /**
     * @param {string} txid
     * @returns {Promise<WasmTransactionDetailsData>}
     */
    getTransaction(txid) {
        const ptr0 = passStringToWasm0(txid, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmaccount_getTransaction(this.__wbg_ptr, ptr0, len0);
        return ret;
    }
    /**
     * @returns {Promise<boolean>}
     */
    hasSyncData() {
        const ret = wasm.wasmaccount_hasSyncData(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {WasmNetwork} network
     * @param {string} txid
     * @param {bigint} fees
     * @returns {Promise<WasmPsbt>}
     */
    bumpTransactionsFees(network, txid, fees) {
        const ptr0 = passStringToWasm0(txid, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmaccount_bumpTransactionsFees(this.__wbg_ptr, network, ptr0, len0, fees);
        return ret;
    }
    /**
     * @returns {Promise<void>}
     */
    clearStore() {
        const ret = wasm.wasmaccount_clearStore(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {Promise<string>}
     */
    getXpub() {
        const ret = wasm.wasmaccount_getXpub(this.__wbg_ptr);
        return ret;
    }
}

const WasmAccountSweeperFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmaccountsweeper_free(ptr >>> 0, 1));

export class WasmAccountSweeper {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmAccountSweeperFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmaccountsweeper_free(ptr, 0);
    }
    /**
     * @param {WasmBlockchainClient} client
     * @param {WasmAccount} account
     */
    constructor(client, account) {
        _assertClass(client, WasmBlockchainClient);
        _assertClass(account, WasmAccount);
        const ret = wasm.wasmaccountsweeper_new(client.__wbg_ptr, account.__wbg_ptr);
        this.__wbg_ptr = ret >>> 0;
        WasmAccountSweeperFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {string} wif
     * @param {bigint} sat_per_vb
     * @param {number} receive_address_index
     * @param {WasmNetwork} network
     * @returns {Promise<WasmPsbt>}
     */
    getSweepWifPsbt(wif, sat_per_vb, receive_address_index, network) {
        const ptr0 = passStringToWasm0(wif, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmaccountsweeper_getSweepWifPsbt(this.__wbg_ptr, ptr0, len0, sat_per_vb, receive_address_index, network);
        return ret;
    }
}

const WasmAccountSyncerFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmaccountsyncer_free(ptr >>> 0, 1));

export class WasmAccountSyncer {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmAccountSyncerFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmaccountsyncer_free(ptr, 0);
    }
    /**
     * @param {WasmBlockchainClient} client
     * @param {WasmAccount} account
     */
    constructor(client, account) {
        _assertClass(client, WasmBlockchainClient);
        _assertClass(account, WasmAccount);
        const ret = wasm.wasmaccountsyncer_new(client.__wbg_ptr, account.__wbg_ptr);
        this.__wbg_ptr = ret >>> 0;
        WasmAccountSyncerFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {number | null} [stop_gap]
     * @returns {Promise<void>}
     */
    fullSync(stop_gap) {
        const ret = wasm.wasmaccountsyncer_fullSync(this.__wbg_ptr, isLikeNone(stop_gap) ? 0x100000001 : (stop_gap) >>> 0);
        return ret;
    }
    /**
     * @returns {Promise<void>}
     */
    partialSync() {
        const ret = wasm.wasmaccountsyncer_partialSync(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {Promise<boolean>}
     */
    shouldSync() {
        const ret = wasm.wasmaccountsyncer_shouldSync(this.__wbg_ptr);
        return ret;
    }
}

const WasmAddressFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmaddress_free(ptr >>> 0, 1));

export class WasmAddress {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmAddress.prototype);
        obj.__wbg_ptr = ptr;
        WasmAddressFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmAddressFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmaddress_free(ptr, 0);
    }
    /**
     * @param {string} str
     * @param {WasmNetwork} network
     */
    constructor(str, network) {
        const ptr0 = passStringToWasm0(str, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmaddress_new(ptr0, len0, network);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0] >>> 0;
        WasmAddressFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {WasmScript} value
     * @param {WasmNetwork} network
     * @returns {WasmAddress}
     */
    static fromScript(value, network) {
        _assertClass(value, WasmScript);
        var ptr0 = value.__destroy_into_raw();
        const ret = wasm.wasmaddress_fromScript(ptr0, network);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmAddress.__wrap(ret[0]);
    }
    /**
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.wasmaddress_toString(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {WasmScript}
     */
    intoScript() {
        const ret = wasm.wasmaddress_intoScript(this.__wbg_ptr);
        return WasmScript.__wrap(ret);
    }
}

const WasmAddressDetailsArrayFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmaddressdetailsarray_free(ptr >>> 0, 1));

export class WasmAddressDetailsArray {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmAddressDetailsArray.prototype);
        obj.__wbg_ptr = ptr;
        WasmAddressDetailsArrayFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmAddressDetailsArrayFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmaddressdetailsarray_free(ptr, 0);
    }
    /**
     * @returns {WasmAddressDetailsData[]}
     */
    get 0() {
        const ret = wasm.__wbg_get_wasmaddressdetailsarray_0(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @param {WasmAddressDetailsData[]} arg0
     */
    set 0(arg0) {
        const ptr0 = passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmaddressdetailsarray_0(this.__wbg_ptr, ptr0, len0);
    }
}

const WasmAddressDetailsDataFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmaddressdetailsdata_free(ptr >>> 0, 1));

export class WasmAddressDetailsData {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmAddressDetailsData.prototype);
        obj.__wbg_ptr = ptr;
        WasmAddressDetailsDataFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    static __unwrap(jsValue) {
        if (!(jsValue instanceof WasmAddressDetailsData)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmAddressDetailsDataFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmaddressdetailsdata_free(ptr, 0);
    }
    /**
     * @returns {WasmAddressDetails}
     */
    get Data() {
        const ret = wasm.__wbg_get_wasmaddressdetailsdata_Data(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {WasmAddressDetails} arg0
     */
    set Data(arg0) {
        wasm.__wbg_set_wasmaddressdetailsdata_Data(this.__wbg_ptr, arg0);
    }
}

const WasmAddressInfoFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmaddressinfo_free(ptr >>> 0, 1));

export class WasmAddressInfo {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmAddressInfo.prototype);
        obj.__wbg_ptr = ptr;
        WasmAddressInfoFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmAddressInfoFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmaddressinfo_free(ptr, 0);
    }
    /**
     * Child index of this address
     * @returns {number}
     */
    get index() {
        const ret = wasm.__wbg_get_wasmaddressinfo_index(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Child index of this address
     * @param {number} arg0
     */
    set index(arg0) {
        wasm.__wbg_set_wasmaddressinfo_index(this.__wbg_ptr, arg0);
    }
    /**
     * Address
     * @returns {string}
     */
    get address() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.__wbg_get_wasmaddressinfo_address(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Address
     * @param {string} arg0
     */
    set address(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmaddressinfo_address(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * Type of keychain
     * @returns {WasmKeychainKind}
     */
    get keychain() {
        const ret = wasm.__wbg_get_wasmaddressinfo_keychain(this.__wbg_ptr);
        return ret;
    }
    /**
     * Type of keychain
     * @param {WasmKeychainKind} arg0
     */
    set keychain(arg0) {
        wasm.__wbg_set_wasmaddressinfo_keychain(this.__wbg_ptr, arg0);
    }
}

const WasmApiBitcoinAddressCreationPayloadDataFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmapibitcoinaddresscreationpayloaddata_free(ptr >>> 0, 1));

export class WasmApiBitcoinAddressCreationPayloadData {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmApiBitcoinAddressCreationPayloadData.prototype);
        obj.__wbg_ptr = ptr;
        WasmApiBitcoinAddressCreationPayloadDataFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    static __unwrap(jsValue) {
        if (!(jsValue instanceof WasmApiBitcoinAddressCreationPayloadData)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmApiBitcoinAddressCreationPayloadDataFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmapibitcoinaddresscreationpayloaddata_free(ptr, 0);
    }
    /**
     * @returns {WasmApiBitcoinAddressCreationPayload}
     */
    get Data() {
        const ret = wasm.__wbg_get_wasmapibitcoinaddresscreationpayloaddata_Data(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {WasmApiBitcoinAddressCreationPayload} arg0
     */
    set Data(arg0) {
        wasm.__wbg_set_wasmapibitcoinaddresscreationpayloaddata_Data(this.__wbg_ptr, arg0);
    }
}

const WasmApiBitcoinAddressesCreationPayloadFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmapibitcoinaddressescreationpayload_free(ptr >>> 0, 1));

export class WasmApiBitcoinAddressesCreationPayload {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmApiBitcoinAddressesCreationPayloadFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmapibitcoinaddressescreationpayload_free(ptr, 0);
    }
    /**
     * @returns {WasmApiBitcoinAddressCreationPayloadData[]}
     */
    get 0() {
        const ret = wasm.__wbg_get_wasmapibitcoinaddressescreationpayload_0(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @param {WasmApiBitcoinAddressCreationPayloadData[]} arg0
     */
    set 0(arg0) {
        const ptr0 = passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmapibitcoinaddressescreationpayload_0(this.__wbg_ptr, ptr0, len0);
    }
    constructor() {
        const ret = wasm.wasmapibitcoinaddressescreationpayload_new();
        this.__wbg_ptr = ret >>> 0;
        WasmApiBitcoinAddressesCreationPayloadFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {WasmApiBitcoinAddressCreationPayload} create_payload
     */
    push(create_payload) {
        wasm.wasmapibitcoinaddressescreationpayload_push(this.__wbg_ptr, create_payload);
    }
}

const WasmApiClientsFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmapiclients_free(ptr >>> 0, 1));

export class WasmApiClients {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmApiClients.prototype);
        obj.__wbg_ptr = ptr;
        WasmApiClientsFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmApiClientsFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmapiclients_free(ptr, 0);
    }
    /**
     * @returns {WasmExchangeRateClient}
     */
    get exchange_rate() {
        const ret = wasm.__wbg_get_wasmapiclients_exchange_rate(this.__wbg_ptr);
        return WasmExchangeRateClient.__wrap(ret);
    }
    /**
     * @param {WasmExchangeRateClient} arg0
     */
    set exchange_rate(arg0) {
        _assertClass(arg0, WasmExchangeRateClient);
        var ptr0 = arg0.__destroy_into_raw();
        wasm.__wbg_set_wasmapiclients_exchange_rate(this.__wbg_ptr, ptr0);
    }
    /**
     * @returns {WasmEmailIntegrationClient}
     */
    get email_integration() {
        const ret = wasm.__wbg_get_wasmapiclients_email_integration(this.__wbg_ptr);
        return WasmEmailIntegrationClient.__wrap(ret);
    }
    /**
     * @param {WasmEmailIntegrationClient} arg0
     */
    set email_integration(arg0) {
        _assertClass(arg0, WasmEmailIntegrationClient);
        var ptr0 = arg0.__destroy_into_raw();
        wasm.__wbg_set_wasmapiclients_email_integration(this.__wbg_ptr, ptr0);
    }
    /**
     * @returns {WasmBitcoinAddressClient}
     */
    get bitcoin_address() {
        const ret = wasm.__wbg_get_wasmapiclients_bitcoin_address(this.__wbg_ptr);
        return WasmBitcoinAddressClient.__wrap(ret);
    }
    /**
     * @param {WasmBitcoinAddressClient} arg0
     */
    set bitcoin_address(arg0) {
        _assertClass(arg0, WasmBitcoinAddressClient);
        var ptr0 = arg0.__destroy_into_raw();
        wasm.__wbg_set_wasmapiclients_bitcoin_address(this.__wbg_ptr, ptr0);
    }
    /**
     * @returns {WasmPaymentGatewayClient}
     */
    get payment_gateway() {
        const ret = wasm.__wbg_get_wasmapiclients_payment_gateway(this.__wbg_ptr);
        return WasmPaymentGatewayClient.__wrap(ret);
    }
    /**
     * @param {WasmPaymentGatewayClient} arg0
     */
    set payment_gateway(arg0) {
        _assertClass(arg0, WasmPaymentGatewayClient);
        var ptr0 = arg0.__destroy_into_raw();
        wasm.__wbg_set_wasmapiclients_payment_gateway(this.__wbg_ptr, ptr0);
    }
    /**
     * @returns {WasmPriceGraphClient}
     */
    get price_graph() {
        const ret = wasm.__wbg_get_wasmapiclients_price_graph(this.__wbg_ptr);
        return WasmPriceGraphClient.__wrap(ret);
    }
    /**
     * @param {WasmPriceGraphClient} arg0
     */
    set price_graph(arg0) {
        _assertClass(arg0, WasmPriceGraphClient);
        var ptr0 = arg0.__destroy_into_raw();
        wasm.__wbg_set_wasmapiclients_price_graph(this.__wbg_ptr, ptr0);
    }
    /**
     * @returns {WasmSettingsClient}
     */
    get settings() {
        const ret = wasm.__wbg_get_wasmapiclients_settings(this.__wbg_ptr);
        return WasmSettingsClient.__wrap(ret);
    }
    /**
     * @param {WasmSettingsClient} arg0
     */
    set settings(arg0) {
        _assertClass(arg0, WasmSettingsClient);
        var ptr0 = arg0.__destroy_into_raw();
        wasm.__wbg_set_wasmapiclients_settings(this.__wbg_ptr, ptr0);
    }
    /**
     * @returns {WasmNetworkClient}
     */
    get network() {
        const ret = wasm.__wbg_get_wasmapiclients_network(this.__wbg_ptr);
        return WasmNetworkClient.__wrap(ret);
    }
    /**
     * @param {WasmNetworkClient} arg0
     */
    set network(arg0) {
        _assertClass(arg0, WasmNetworkClient);
        var ptr0 = arg0.__destroy_into_raw();
        wasm.__wbg_set_wasmapiclients_network(this.__wbg_ptr, ptr0);
    }
    /**
     * @returns {WasmInviteClient}
     */
    get invite() {
        const ret = wasm.__wbg_get_wasmapiclients_invite(this.__wbg_ptr);
        return WasmInviteClient.__wrap(ret);
    }
    /**
     * @param {WasmInviteClient} arg0
     */
    set invite(arg0) {
        _assertClass(arg0, WasmInviteClient);
        var ptr0 = arg0.__destroy_into_raw();
        wasm.__wbg_set_wasmapiclients_invite(this.__wbg_ptr, ptr0);
    }
    /**
     * @returns {WasmWalletClient}
     */
    get wallet() {
        const ret = wasm.__wbg_get_wasmapiclients_wallet(this.__wbg_ptr);
        return WasmWalletClient.__wrap(ret);
    }
    /**
     * @param {WasmWalletClient} arg0
     */
    set wallet(arg0) {
        _assertClass(arg0, WasmWalletClient);
        var ptr0 = arg0.__destroy_into_raw();
        wasm.__wbg_set_wasmapiclients_wallet(this.__wbg_ptr, ptr0);
    }
}

const WasmApiExchangeRateDataFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmapiexchangeratedata_free(ptr >>> 0, 1));

export class WasmApiExchangeRateData {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmApiExchangeRateData.prototype);
        obj.__wbg_ptr = ptr;
        WasmApiExchangeRateDataFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmApiExchangeRateDataFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmapiexchangeratedata_free(ptr, 0);
    }
    /**
     * @returns {WasmApiExchangeRate}
     */
    get Data() {
        const ret = wasm.__wbg_get_wasmapiexchangeratedata_Data(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {WasmApiExchangeRate} arg0
     */
    set Data(arg0) {
        wasm.__wbg_set_wasmapiexchangeratedata_Data(this.__wbg_ptr, arg0);
    }
}

const WasmApiFiatCurrenciesFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmapifiatcurrencies_free(ptr >>> 0, 1));

export class WasmApiFiatCurrencies {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmApiFiatCurrencies.prototype);
        obj.__wbg_ptr = ptr;
        WasmApiFiatCurrenciesFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmApiFiatCurrenciesFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmapifiatcurrencies_free(ptr, 0);
    }
    /**
     * @returns {WasmApiFiatCurrencyData[]}
     */
    get 0() {
        const ret = wasm.__wbg_get_wasmapifiatcurrencies_0(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @param {WasmApiFiatCurrencyData[]} arg0
     */
    set 0(arg0) {
        const ptr0 = passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmapifiatcurrencies_0(this.__wbg_ptr, ptr0, len0);
    }
}

const WasmApiFiatCurrencyDataFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmapifiatcurrencydata_free(ptr >>> 0, 1));

export class WasmApiFiatCurrencyData {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmApiFiatCurrencyData.prototype);
        obj.__wbg_ptr = ptr;
        WasmApiFiatCurrencyDataFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    static __unwrap(jsValue) {
        if (!(jsValue instanceof WasmApiFiatCurrencyData)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmApiFiatCurrencyDataFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmapifiatcurrencydata_free(ptr, 0);
    }
    /**
     * @returns {WasmApiFiatCurrency}
     */
    get Data() {
        const ret = wasm.__wbg_get_wasmapifiatcurrencydata_Data(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {WasmApiFiatCurrency} arg0
     */
    set Data(arg0) {
        wasm.__wbg_set_wasmapifiatcurrencydata_Data(this.__wbg_ptr, arg0);
    }
}

const WasmApiWalletAccountAddressesFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmapiwalletaccountaddresses_free(ptr >>> 0, 1));

export class WasmApiWalletAccountAddresses {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmApiWalletAccountAddresses.prototype);
        obj.__wbg_ptr = ptr;
        WasmApiWalletAccountAddressesFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmApiWalletAccountAddressesFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmapiwalletaccountaddresses_free(ptr, 0);
    }
    /**
     * @returns {WasmWalletAccountAddressData[]}
     */
    get 0() {
        const ret = wasm.__wbg_get_wasmapiwalletaccountaddresses_0(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @param {WasmWalletAccountAddressData[]} arg0
     */
    set 0(arg0) {
        const ptr0 = passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmapiwalletaccountaddresses_0(this.__wbg_ptr, ptr0, len0);
    }
}

const WasmApiWalletAccountsFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmapiwalletaccounts_free(ptr >>> 0, 1));

export class WasmApiWalletAccounts {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmApiWalletAccounts.prototype);
        obj.__wbg_ptr = ptr;
        WasmApiWalletAccountsFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmApiWalletAccountsFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmapiwalletaccounts_free(ptr, 0);
    }
    /**
     * @returns {WasmWalletAccountData[]}
     */
    get 0() {
        const ret = wasm.__wbg_get_wasmapiwalletaccounts_0(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @param {WasmWalletAccountData[]} arg0
     */
    set 0(arg0) {
        const ptr0 = passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmapiwalletaccounts_0(this.__wbg_ptr, ptr0, len0);
    }
}

const WasmApiWalletBitcoinAddressDataFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmapiwalletbitcoinaddressdata_free(ptr >>> 0, 1));

export class WasmApiWalletBitcoinAddressData {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmApiWalletBitcoinAddressData.prototype);
        obj.__wbg_ptr = ptr;
        WasmApiWalletBitcoinAddressDataFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    static __unwrap(jsValue) {
        if (!(jsValue instanceof WasmApiWalletBitcoinAddressData)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmApiWalletBitcoinAddressDataFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmapiwalletbitcoinaddressdata_free(ptr, 0);
    }
    /**
     * @returns {WasmApiWalletBitcoinAddress}
     */
    get Data() {
        const ret = wasm.__wbg_get_wasmapiwalletbitcoinaddressdata_Data(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {WasmApiWalletBitcoinAddress} arg0
     */
    set Data(arg0) {
        wasm.__wbg_set_wasmapiwalletbitcoinaddressdata_Data(this.__wbg_ptr, arg0);
    }
}

const WasmApiWalletBitcoinAddressIndexesFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmapiwalletbitcoinaddressindexes_free(ptr >>> 0, 1));

export class WasmApiWalletBitcoinAddressIndexes {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmApiWalletBitcoinAddressIndexes.prototype);
        obj.__wbg_ptr = ptr;
        WasmApiWalletBitcoinAddressIndexesFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmApiWalletBitcoinAddressIndexesFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmapiwalletbitcoinaddressindexes_free(ptr, 0);
    }
    /**
     * @returns {WasmApiWalletBitcoinAddressUsedIndexData[]}
     */
    get 0() {
        const ret = wasm.__wbg_get_wasmapiwalletbitcoinaddressindexes_0(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @param {WasmApiWalletBitcoinAddressUsedIndexData[]} arg0
     */
    set 0(arg0) {
        const ptr0 = passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmapiwalletbitcoinaddressindexes_0(this.__wbg_ptr, ptr0, len0);
    }
}

const WasmApiWalletBitcoinAddressLookupDataFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmapiwalletbitcoinaddresslookupdata_free(ptr >>> 0, 1));

export class WasmApiWalletBitcoinAddressLookupData {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmApiWalletBitcoinAddressLookupData.prototype);
        obj.__wbg_ptr = ptr;
        WasmApiWalletBitcoinAddressLookupDataFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmApiWalletBitcoinAddressLookupDataFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmapiwalletbitcoinaddresslookupdata_free(ptr, 0);
    }
    /**
     * @returns {WasmApiWalletBitcoinAddressLookup}
     */
    get Data() {
        const ret = wasm.__wbg_get_wasmapiwalletbitcoinaddresslookupdata_Data(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {WasmApiWalletBitcoinAddressLookup} arg0
     */
    set Data(arg0) {
        wasm.__wbg_set_wasmapiwalletbitcoinaddresslookupdata_Data(this.__wbg_ptr, arg0);
    }
}

const WasmApiWalletBitcoinAddressUsedIndexDataFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmapiwalletbitcoinaddressusedindexdata_free(ptr >>> 0, 1));

export class WasmApiWalletBitcoinAddressUsedIndexData {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmApiWalletBitcoinAddressUsedIndexData.prototype);
        obj.__wbg_ptr = ptr;
        WasmApiWalletBitcoinAddressUsedIndexDataFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    static __unwrap(jsValue) {
        if (!(jsValue instanceof WasmApiWalletBitcoinAddressUsedIndexData)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmApiWalletBitcoinAddressUsedIndexDataFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmapiwalletbitcoinaddressusedindexdata_free(ptr, 0);
    }
    /**
     * @returns {bigint}
     */
    get Data() {
        const ret = wasm.__wbg_get_wasmapiwalletbitcoinaddressusedindexdata_Data(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * @param {bigint} arg0
     */
    set Data(arg0) {
        wasm.__wbg_set_wasmapiwalletbitcoinaddressusedindexdata_Data(this.__wbg_ptr, arg0);
    }
}

const WasmApiWalletBitcoinAddressesFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmapiwalletbitcoinaddresses_free(ptr >>> 0, 1));

export class WasmApiWalletBitcoinAddresses {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmApiWalletBitcoinAddresses.prototype);
        obj.__wbg_ptr = ptr;
        WasmApiWalletBitcoinAddressesFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmApiWalletBitcoinAddressesFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmapiwalletbitcoinaddresses_free(ptr, 0);
    }
    /**
     * @returns {WasmApiWalletBitcoinAddressData[]}
     */
    get 0() {
        const ret = wasm.__wbg_get_wasmapiwalletbitcoinaddresses_0(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @param {WasmApiWalletBitcoinAddressData[]} arg0
     */
    set 0(arg0) {
        const ptr0 = passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmapiwalletbitcoinaddresses_0(this.__wbg_ptr, ptr0, len0);
    }
}

const WasmApiWalletDataFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmapiwalletdata_free(ptr >>> 0, 1));

export class WasmApiWalletData {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmApiWalletData.prototype);
        obj.__wbg_ptr = ptr;
        WasmApiWalletDataFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    static __unwrap(jsValue) {
        if (!(jsValue instanceof WasmApiWalletData)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmApiWalletDataFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmapiwalletdata_free(ptr, 0);
    }
    /**
     * @returns {WasmApiWallet}
     */
    get Wallet() {
        const ret = wasm.__wbg_get_wasmapiwalletdata_Wallet(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {WasmApiWallet} arg0
     */
    set Wallet(arg0) {
        wasm.__wbg_set_wasmapiwalletdata_Wallet(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {WasmApiWalletKey}
     */
    get WalletKey() {
        const ret = wasm.__wbg_get_wasmapiwalletdata_WalletKey(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {WasmApiWalletKey} arg0
     */
    set WalletKey(arg0) {
        wasm.__wbg_set_wasmapiwalletdata_WalletKey(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {WasmApiWalletSettings}
     */
    get WalletSettings() {
        const ret = wasm.__wbg_get_wasmapiwalletdata_WalletSettings(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {WasmApiWalletSettings} arg0
     */
    set WalletSettings(arg0) {
        wasm.__wbg_set_wasmapiwalletdata_WalletSettings(this.__wbg_ptr, arg0);
    }
    /**
     * @param {WasmApiWallet} wallet
     * @param {WasmApiWalletKey} key
     * @param {WasmApiWalletSettings} settings
     * @returns {WasmApiWalletData}
     */
    static from_parts(wallet, key, settings) {
        const ret = wasm.wasmapiwalletdata_from_parts(wallet, key, settings);
        return WasmApiWalletData.__wrap(ret);
    }
}

const WasmApiWalletTransactionDataFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmapiwallettransactiondata_free(ptr >>> 0, 1));

export class WasmApiWalletTransactionData {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmApiWalletTransactionData.prototype);
        obj.__wbg_ptr = ptr;
        WasmApiWalletTransactionDataFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    static __unwrap(jsValue) {
        if (!(jsValue instanceof WasmApiWalletTransactionData)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmApiWalletTransactionDataFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmapiwallettransactiondata_free(ptr, 0);
    }
    /**
     * @returns {WasmApiWalletTransaction}
     */
    get Data() {
        const ret = wasm.__wbg_get_wasmapiwallettransactiondata_Data(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {WasmApiWalletTransaction} arg0
     */
    set Data(arg0) {
        wasm.__wbg_set_wasmapiwallettransactiondata_Data(this.__wbg_ptr, arg0);
    }
}

const WasmApiWalletTransactionsFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmapiwallettransactions_free(ptr >>> 0, 1));

export class WasmApiWalletTransactions {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmApiWalletTransactions.prototype);
        obj.__wbg_ptr = ptr;
        WasmApiWalletTransactionsFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmApiWalletTransactionsFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmapiwallettransactions_free(ptr, 0);
    }
    /**
     * @returns {WasmApiWalletTransactionData[]}
     */
    get 0() {
        const ret = wasm.__wbg_get_wasmapiwallettransactions_0(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @param {WasmApiWalletTransactionData[]} arg0
     */
    set 0(arg0) {
        const ptr0 = passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmapiwallettransactions_0(this.__wbg_ptr, ptr0, len0);
    }
}

const WasmApiWalletsDataFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmapiwalletsdata_free(ptr >>> 0, 1));

export class WasmApiWalletsData {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmApiWalletsData.prototype);
        obj.__wbg_ptr = ptr;
        WasmApiWalletsDataFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmApiWalletsDataFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmapiwalletsdata_free(ptr, 0);
    }
    /**
     * @returns {WasmApiWalletData[]}
     */
    get 0() {
        const ret = wasm.__wbg_get_wasmapiwalletsdata_0(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @param {WasmApiWalletData[]} arg0
     */
    set 0(arg0) {
        const ptr0 = passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmapiwalletsdata_0(this.__wbg_ptr, ptr0, len0);
    }
}

const WasmAuthDataFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmauthdata_free(ptr >>> 0, 1));

export class WasmAuthData {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmAuthDataFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmauthdata_free(ptr, 0);
    }
    /**
     * @returns {string}
     */
    get uid() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.__wbg_get_wasmauthdata_uid(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {string} arg0
     */
    set uid(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmauthdata_uid(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @returns {string}
     */
    get access() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.__wbg_get_wasmauthdata_access(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {string} arg0
     */
    set access(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmauthdata_access(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @returns {string}
     */
    get refresh() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.__wbg_get_wasmauthdata_refresh(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {string} arg0
     */
    set refresh(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmauthdata_refresh(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @returns {string[]}
     */
    get scopes() {
        const ret = wasm.__wbg_get_wasmauthdata_scopes(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @param {string[]} arg0
     */
    set scopes(arg0) {
        const ptr0 = passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmauthdata_scopes(this.__wbg_ptr, ptr0, len0);
    }
}

const WasmBalanceWrapperFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmbalancewrapper_free(ptr >>> 0, 1));

export class WasmBalanceWrapper {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmBalanceWrapper.prototype);
        obj.__wbg_ptr = ptr;
        WasmBalanceWrapperFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmBalanceWrapperFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmbalancewrapper_free(ptr, 0);
    }
    /**
     * @returns {WasmBalance}
     */
    get data() {
        const ret = wasm.__wbg_get_wasmbalancewrapper_data(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {WasmBalance} arg0
     */
    set data(arg0) {
        wasm.__wbg_set_wasmbalancewrapper_data(this.__wbg_ptr, arg0);
    }
}

const WasmBitcoinAddressClientFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmbitcoinaddressclient_free(ptr >>> 0, 1));

export class WasmBitcoinAddressClient {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmBitcoinAddressClient.prototype);
        obj.__wbg_ptr = ptr;
        WasmBitcoinAddressClientFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmBitcoinAddressClientFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmbitcoinaddressclient_free(ptr, 0);
    }
    /**
     * @param {string} wallet_id
     * @param {string} wallet_account_id
     * @param {number | null} [only_without_bitcoin_addresses]
     * @returns {Promise<WasmApiWalletBitcoinAddresses>}
     */
    getBitcoinAddresses(wallet_id, wallet_account_id, only_without_bitcoin_addresses) {
        const ptr0 = passStringToWasm0(wallet_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(wallet_account_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.wasmbitcoinaddressclient_getBitcoinAddresses(this.__wbg_ptr, ptr0, len0, ptr1, len1, isLikeNone(only_without_bitcoin_addresses) ? 0xFFFFFF : only_without_bitcoin_addresses);
        return ret;
    }
    /**
     * @param {string} wallet_id
     * @param {string} wallet_account_id
     * @returns {Promise<bigint>}
     */
    getBitcoinAddressHighestIndex(wallet_id, wallet_account_id) {
        const ptr0 = passStringToWasm0(wallet_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(wallet_account_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.wasmbitcoinaddressclient_getBitcoinAddressHighestIndex(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return ret;
    }
    /**
     * @param {string} wallet_id
     * @param {string} wallet_account_id
     * @returns {Promise<WasmApiWalletBitcoinAddressIndexes>}
     */
    getUsedIndexes(wallet_id, wallet_account_id) {
        const ptr0 = passStringToWasm0(wallet_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(wallet_account_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.wasmbitcoinaddressclient_getUsedIndexes(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return ret;
    }
    /**
     * @param {string} wallet_id
     * @param {string} wallet_account_id
     * @param {WasmApiBitcoinAddressesCreationPayload} bitcoin_addresses
     * @returns {Promise<WasmApiWalletBitcoinAddresses>}
     */
    addBitcoinAddresses(wallet_id, wallet_account_id, bitcoin_addresses) {
        const ptr0 = passStringToWasm0(wallet_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(wallet_account_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        _assertClass(bitcoin_addresses, WasmApiBitcoinAddressesCreationPayload);
        var ptr2 = bitcoin_addresses.__destroy_into_raw();
        const ret = wasm.wasmbitcoinaddressclient_addBitcoinAddresses(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2);
        return ret;
    }
    /**
     * @param {string} wallet_id
     * @param {string} wallet_account_id
     * @param {string} wallet_account_bitcoin_address_id
     * @param {WasmApiBitcoinAddressCreationPayload} bitcoin_address
     * @returns {Promise<WasmApiWalletBitcoinAddressData>}
     */
    updateBitcoinAddress(wallet_id, wallet_account_id, wallet_account_bitcoin_address_id, bitcoin_address) {
        const ptr0 = passStringToWasm0(wallet_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(wallet_account_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(wallet_account_bitcoin_address_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ret = wasm.wasmbitcoinaddressclient_updateBitcoinAddress(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2, bitcoin_address);
        return ret;
    }
}

const WasmBlockchainClientFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmblockchainclient_free(ptr >>> 0, 1));

export class WasmBlockchainClient {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmBlockchainClientFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmblockchainclient_free(ptr, 0);
    }
    /**
     * Generates a Mnemonic with a random entropy based on the given word
     * count.
     * @param {WasmProtonWalletApiClient} proton_api_client
     */
    constructor(proton_api_client) {
        _assertClass(proton_api_client, WasmProtonWalletApiClient);
        const ret = wasm.wasmblockchainclient_new(proton_api_client.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0] >>> 0;
        WasmBlockchainClientFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {Promise<Map<string, number>>}
     */
    getFeesEstimation() {
        const ret = wasm.wasmblockchainclient_getFeesEstimation(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {Promise<WasmMinimumFees>}
     */
    getMininumFees() {
        const ret = wasm.wasmblockchainclient_getMininumFees(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {Promise<WasmRecommendedFees>}
     */
    getRecommendedFees() {
        const ret = wasm.wasmblockchainclient_getRecommendedFees(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {WasmPsbt} psbt
     * @param {string} wallet_id
     * @param {string} wallet_account_id
     * @param {WasmTransactionData} transaction_data
     * @param {WasmEmailIntegrationData | null} [email_integration]
     * @param {number | null} [is_paper_wallet]
     * @returns {Promise<string>}
     */
    broadcastPsbt(psbt, wallet_id, wallet_account_id, transaction_data, email_integration, is_paper_wallet) {
        _assertClass(psbt, WasmPsbt);
        const ptr0 = passStringToWasm0(wallet_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(wallet_account_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.wasmblockchainclient_broadcastPsbt(this.__wbg_ptr, psbt.__wbg_ptr, ptr0, len0, ptr1, len1, transaction_data, isLikeNone(email_integration) ? 0 : addToExternrefTable0(email_integration), isLikeNone(is_paper_wallet) ? 0xFFFFFF : is_paper_wallet);
        return ret;
    }
}

const WasmCountriesAndProviderTuppleFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmcountriesandprovidertupple_free(ptr >>> 0, 1));

export class WasmCountriesAndProviderTupple {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmCountriesAndProviderTupple.prototype);
        obj.__wbg_ptr = ptr;
        WasmCountriesAndProviderTuppleFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    static __unwrap(jsValue) {
        if (!(jsValue instanceof WasmCountriesAndProviderTupple)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmCountriesAndProviderTuppleFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmcountriesandprovidertupple_free(ptr, 0);
    }
    /**
     * @returns {WasmGatewayProvider}
     */
    get 0() {
        const ret = wasm.__wbg_get_wasmcountriesandprovidertupple_0(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {WasmGatewayProvider} arg0
     */
    set 0(arg0) {
        wasm.__wbg_set_wasmcountriesandprovidertupple_0(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {WasmCountries}
     */
    get 1() {
        const ret = wasm.__wbg_get_wasmcountriesandprovidertupple_1(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {WasmCountries} arg0
     */
    set 1(arg0) {
        wasm.__wbg_set_wasmcountriesandprovidertupple_1(this.__wbg_ptr, arg0);
    }
}

const WasmCountriesByProviderFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmcountriesbyprovider_free(ptr >>> 0, 1));

export class WasmCountriesByProvider {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmCountriesByProvider.prototype);
        obj.__wbg_ptr = ptr;
        WasmCountriesByProviderFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmCountriesByProviderFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmcountriesbyprovider_free(ptr, 0);
    }
    /**
     * @returns {WasmCountriesAndProviderTupple[]}
     */
    get data() {
        const ret = wasm.__wbg_get_wasmcountriesbyprovider_data(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @param {WasmCountriesAndProviderTupple[]} arg0
     */
    set data(arg0) {
        const ptr0 = passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmcountriesbyprovider_data(this.__wbg_ptr, ptr0, len0);
    }
}

const WasmDerivationPathFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmderivationpath_free(ptr >>> 0, 1));

export class WasmDerivationPath {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmDerivationPath.prototype);
        obj.__wbg_ptr = ptr;
        WasmDerivationPathFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmDerivationPathFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmderivationpath_free(ptr, 0);
    }
    /**
     * @param {string} path
     */
    constructor(path) {
        const ptr0 = passStringToWasm0(path, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmderivationpath_new(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0] >>> 0;
        WasmDerivationPathFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {WasmScriptType} script_type
     * @param {WasmNetwork} network
     * @param {number} account_index
     * @returns {WasmDerivationPath}
     */
    static fromParts(script_type, network, account_index) {
        const ret = wasm.wasmderivationpath_fromParts(script_type, network, account_index);
        return WasmDerivationPath.__wrap(ret);
    }
    /**
     * @param {string} str
     * @returns {WasmDerivationPath}
     */
    static fromString(str) {
        const ptr0 = passStringToWasm0(str, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmderivationpath_fromString(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmDerivationPath.__wrap(ret[0]);
    }
    /**
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.wasmderivationpath_toString(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}

const WasmDetailledTxInFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmdetailledtxin_free(ptr >>> 0, 1));

export class WasmDetailledTxIn {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmDetailledTxInFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmdetailledtxin_free(ptr, 0);
    }
    /**
     * @returns {WasmTxOut | undefined}
     */
    get previous_output() {
        const ret = wasm.__wbg_get_wasmdetailledtxin_previous_output(this.__wbg_ptr);
        return ret === 0 ? undefined : WasmTxOut.__wrap(ret);
    }
    /**
     * @param {WasmTxOut | null} [arg0]
     */
    set previous_output(arg0) {
        let ptr0 = 0;
        if (!isLikeNone(arg0)) {
            _assertClass(arg0, WasmTxOut);
            ptr0 = arg0.__destroy_into_raw();
        }
        wasm.__wbg_set_wasmdetailledtxin_previous_output(this.__wbg_ptr, ptr0);
    }
    /**
     * @returns {WasmScript}
     */
    get script_sig() {
        const ret = wasm.__wbg_get_wasmdetailledtxin_script_sig(this.__wbg_ptr);
        return WasmScript.__wrap(ret);
    }
    /**
     * @param {WasmScript} arg0
     */
    set script_sig(arg0) {
        _assertClass(arg0, WasmScript);
        var ptr0 = arg0.__destroy_into_raw();
        wasm.__wbg_set_wasmdetailledtxin_script_sig(this.__wbg_ptr, ptr0);
    }
    /**
     * @returns {WasmSequence}
     */
    get sequence() {
        const ret = wasm.__wbg_get_wasmdetailledtxin_sequence(this.__wbg_ptr);
        return WasmSequence.__wrap(ret);
    }
    /**
     * @param {WasmSequence} arg0
     */
    set sequence(arg0) {
        _assertClass(arg0, WasmSequence);
        var ptr0 = arg0.__destroy_into_raw();
        wasm.__wbg_set_wasmdetailledtxin_sequence(this.__wbg_ptr, ptr0);
    }
}

const WasmDiscoveredAccountFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmdiscoveredaccount_free(ptr >>> 0, 1));

export class WasmDiscoveredAccount {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmDiscoveredAccount.prototype);
        obj.__wbg_ptr = ptr;
        WasmDiscoveredAccountFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    static __unwrap(jsValue) {
        if (!(jsValue instanceof WasmDiscoveredAccount)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmDiscoveredAccountFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmdiscoveredaccount_free(ptr, 0);
    }
    /**
     * @returns {WasmScriptType}
     */
    get 0() {
        const ret = wasm.__wbg_get_wasmdiscoveredaccount_0(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {WasmScriptType} arg0
     */
    set 0(arg0) {
        wasm.__wbg_set_wasmdiscoveredaccount_0(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {number}
     */
    get 1() {
        const ret = wasm.__wbg_get_wasmdiscoveredaccount_1(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {number} arg0
     */
    set 1(arg0) {
        wasm.__wbg_set_wasmdiscoveredaccount_1(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {WasmDerivationPath}
     */
    get 2() {
        const ret = wasm.__wbg_get_wasmdiscoveredaccount_2(this.__wbg_ptr);
        return WasmDerivationPath.__wrap(ret);
    }
    /**
     * @param {WasmDerivationPath} arg0
     */
    set 2(arg0) {
        _assertClass(arg0, WasmDerivationPath);
        var ptr0 = arg0.__destroy_into_raw();
        wasm.__wbg_set_wasmdiscoveredaccount_2(this.__wbg_ptr, ptr0);
    }
}

const WasmDiscoveredAccountsFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmdiscoveredaccounts_free(ptr >>> 0, 1));

export class WasmDiscoveredAccounts {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmDiscoveredAccounts.prototype);
        obj.__wbg_ptr = ptr;
        WasmDiscoveredAccountsFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmDiscoveredAccountsFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmdiscoveredaccounts_free(ptr, 0);
    }
    /**
     * @returns {WasmDiscoveredAccount[]}
     */
    get data() {
        const ret = wasm.__wbg_get_wasmdiscoveredaccounts_data(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @param {WasmDiscoveredAccount[]} arg0
     */
    set data(arg0) {
        const ptr0 = passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmdiscoveredaccounts_data(this.__wbg_ptr, ptr0, len0);
    }
}

const WasmEmailIntegrationClientFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmemailintegrationclient_free(ptr >>> 0, 1));

export class WasmEmailIntegrationClient {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmEmailIntegrationClient.prototype);
        obj.__wbg_ptr = ptr;
        WasmEmailIntegrationClientFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmEmailIntegrationClientFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmemailintegrationclient_free(ptr, 0);
    }
    /**
     * @param {string} email
     * @returns {Promise<WasmApiWalletBitcoinAddressLookupData>}
     */
    lookupBitcoinAddress(email) {
        const ptr0 = passStringToWasm0(email, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmemailintegrationclient_lookupBitcoinAddress(this.__wbg_ptr, ptr0, len0);
        return ret;
    }
    /**
     * @param {string} email
     * @returns {Promise<void>}
     */
    createBitcoinAddressesRequest(email) {
        const ptr0 = passStringToWasm0(email, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmemailintegrationclient_createBitcoinAddressesRequest(this.__wbg_ptr, ptr0, len0);
        return ret;
    }
}

const WasmExchangeRateClientFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmexchangerateclient_free(ptr >>> 0, 1));

export class WasmExchangeRateClient {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmExchangeRateClient.prototype);
        obj.__wbg_ptr = ptr;
        WasmExchangeRateClientFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmExchangeRateClientFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmexchangerateclient_free(ptr, 0);
    }
    /**
     * @param {WasmFiatCurrencySymbol} fiat
     * @param {bigint | null} [time]
     * @returns {Promise<WasmApiExchangeRateData>}
     */
    getExchangeRate(fiat, time) {
        const ret = wasm.wasmexchangerateclient_getExchangeRate(this.__wbg_ptr, fiat, !isLikeNone(time), isLikeNone(time) ? BigInt(0) : time);
        return ret;
    }
    /**
     * @returns {Promise<WasmApiFiatCurrencies>}
     */
    getAllFiatCurrencies() {
        const ret = wasm.wasmexchangerateclient_getAllFiatCurrencies(this.__wbg_ptr);
        return ret;
    }
}

const WasmFiatCurrenciesAndProviderTuppleFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmfiatcurrenciesandprovidertupple_free(ptr >>> 0, 1));

export class WasmFiatCurrenciesAndProviderTupple {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmFiatCurrenciesAndProviderTupple.prototype);
        obj.__wbg_ptr = ptr;
        WasmFiatCurrenciesAndProviderTuppleFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    static __unwrap(jsValue) {
        if (!(jsValue instanceof WasmFiatCurrenciesAndProviderTupple)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmFiatCurrenciesAndProviderTuppleFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmfiatcurrenciesandprovidertupple_free(ptr, 0);
    }
    /**
     * @returns {WasmGatewayProvider}
     */
    get 0() {
        const ret = wasm.__wbg_get_wasmfiatcurrenciesandprovidertupple_0(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {WasmGatewayProvider} arg0
     */
    set 0(arg0) {
        wasm.__wbg_set_wasmfiatcurrenciesandprovidertupple_0(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {WasmFiatCurrencies}
     */
    get 1() {
        const ret = wasm.__wbg_get_wasmfiatcurrenciesandprovidertupple_1(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {WasmFiatCurrencies} arg0
     */
    set 1(arg0) {
        wasm.__wbg_set_wasmfiatcurrenciesandprovidertupple_1(this.__wbg_ptr, arg0);
    }
}

const WasmFiatCurrenciesByProviderFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmfiatcurrenciesbyprovider_free(ptr >>> 0, 1));

export class WasmFiatCurrenciesByProvider {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmFiatCurrenciesByProvider.prototype);
        obj.__wbg_ptr = ptr;
        WasmFiatCurrenciesByProviderFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmFiatCurrenciesByProviderFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmfiatcurrenciesbyprovider_free(ptr, 0);
    }
    /**
     * @returns {WasmFiatCurrenciesAndProviderTupple[]}
     */
    get data() {
        const ret = wasm.__wbg_get_wasmfiatcurrenciesbyprovider_data(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @param {WasmFiatCurrenciesAndProviderTupple[]} arg0
     */
    set data(arg0) {
        const ptr0 = passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmfiatcurrenciesbyprovider_data(this.__wbg_ptr, ptr0, len0);
    }
}

const WasmInviteClientFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasminviteclient_free(ptr >>> 0, 1));

export class WasmInviteClient {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmInviteClient.prototype);
        obj.__wbg_ptr = ptr;
        WasmInviteClientFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmInviteClientFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasminviteclient_free(ptr, 0);
    }
    /**
     * @param {string} invitee_email
     * @param {string} inviter_address_id
     * @returns {Promise<void>}
     */
    sendNewcomerInvite(invitee_email, inviter_address_id) {
        const ptr0 = passStringToWasm0(invitee_email, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(inviter_address_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.wasminviteclient_sendNewcomerInvite(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return ret;
    }
    /**
     * @param {string} invitee_email
     * @param {WasmInviteNotificationType} invite_notification_type
     * @param {string} inviter_address_id
     * @returns {Promise<number>}
     */
    checkInviteStatus(invitee_email, invite_notification_type, inviter_address_id) {
        const ptr0 = passStringToWasm0(invitee_email, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(inviter_address_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.wasminviteclient_checkInviteStatus(this.__wbg_ptr, ptr0, len0, invite_notification_type, ptr1, len1);
        return ret;
    }
    /**
     * @param {string} invitee_email
     * @param {string} inviter_address_id
     * @returns {Promise<void>}
     */
    sendEmailIntegrationInvite(invitee_email, inviter_address_id) {
        const ptr0 = passStringToWasm0(invitee_email, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(inviter_address_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.wasminviteclient_sendEmailIntegrationInvite(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return ret;
    }
    /**
     * @returns {Promise<WasmRemainingMonthlyInvitations>}
     */
    getRemainingMonthlyInvitation() {
        const ret = wasm.wasminviteclient_getRemainingMonthlyInvitation(this.__wbg_ptr);
        return ret;
    }
}

const WasmLockTimeFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmlocktime_free(ptr >>> 0, 1));

export class WasmLockTime {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmLockTime.prototype);
        obj.__wbg_ptr = ptr;
        WasmLockTimeFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmLockTimeFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmlocktime_free(ptr, 0);
    }
    /**
     * @param {number} height
     * @returns {WasmLockTime}
     */
    static fromHeight(height) {
        const ret = wasm.wasmlocktime_fromHeight(height);
        return WasmLockTime.__wrap(ret);
    }
    /**
     * @param {number} seconds
     * @returns {WasmLockTime}
     */
    static fromSeconds(seconds) {
        const ret = wasm.wasmlocktime_fromSeconds(seconds);
        return WasmLockTime.__wrap(ret);
    }
    /**
     * @returns {boolean}
     */
    isBlockHeight() {
        const ret = wasm.wasmlocktime_isBlockHeight(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {boolean}
     */
    isBlockTime() {
        const ret = wasm.wasmlocktime_isBlockTime(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {number}
     */
    toConsensusU32() {
        const ret = wasm.wasmlocktime_toConsensusU32(this.__wbg_ptr);
        return ret >>> 0;
    }
}

const WasmMessageSignerFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmmessagesigner_free(ptr >>> 0, 1));

export class WasmMessageSigner {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmMessageSignerFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmmessagesigner_free(ptr, 0);
    }
    constructor() {
        const ret = wasm.wasmmessagesigner_new();
        this.__wbg_ptr = ret >>> 0;
        WasmMessageSignerFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {WasmAccount} account
     * @param {string} message
     * @param {WasmSigningType} signing_type
     * @param {string} btc_address
     * @returns {Promise<string>}
     */
    signMessage(account, message, signing_type, btc_address) {
        _assertClass(account, WasmAccount);
        const ptr0 = passStringToWasm0(message, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(btc_address, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.wasmmessagesigner_signMessage(this.__wbg_ptr, account.__wbg_ptr, ptr0, len0, signing_type, ptr1, len1);
        return ret;
    }
    /**
     * @param {WasmAccount} account
     * @param {string} message
     * @param {string} signature
     * @param {string} btc_address
     * @returns {Promise<void>}
     */
    verifyMessage(account, message, signature, btc_address) {
        _assertClass(account, WasmAccount);
        const ptr0 = passStringToWasm0(message, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(signature, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(btc_address, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ret = wasm.wasmmessagesigner_verifyMessage(this.__wbg_ptr, account.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2);
        return ret;
    }
}

const WasmMigratedWalletAccountDataFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmmigratedwalletaccountdata_free(ptr >>> 0, 1));

export class WasmMigratedWalletAccountData {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmMigratedWalletAccountData.prototype);
        obj.__wbg_ptr = ptr;
        WasmMigratedWalletAccountDataFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    static __unwrap(jsValue) {
        if (!(jsValue instanceof WasmMigratedWalletAccountData)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmMigratedWalletAccountDataFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmmigratedwalletaccountdata_free(ptr, 0);
    }
    /**
     * @returns {WasmMigratedWalletAccount}
     */
    get Data() {
        const ret = wasm.__wbg_get_wasmmigratedwalletaccountdata_Data(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {WasmMigratedWalletAccount} arg0
     */
    set Data(arg0) {
        wasm.__wbg_set_wasmmigratedwalletaccountdata_Data(this.__wbg_ptr, arg0);
    }
}

const WasmMigratedWalletAccountsFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmmigratedwalletaccounts_free(ptr >>> 0, 1));

export class WasmMigratedWalletAccounts {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmMigratedWalletAccountsFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmmigratedwalletaccounts_free(ptr, 0);
    }
    /**
     * @returns {WasmMigratedWalletAccountData[]}
     */
    get 0() {
        const ret = wasm.__wbg_get_wasmmigratedwalletaccounts_0(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @param {WasmMigratedWalletAccountData[]} arg0
     */
    set 0(arg0) {
        const ptr0 = passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmmigratedwalletaccounts_0(this.__wbg_ptr, ptr0, len0);
    }
    constructor() {
        const ret = wasm.wasmmigratedwalletaccounts_new();
        this.__wbg_ptr = ret >>> 0;
        WasmMigratedWalletAccountsFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {WasmMigratedWalletAccount} account_data
     */
    push(account_data) {
        wasm.wasmmigratedwalletaccounts_push(this.__wbg_ptr, account_data);
    }
}

const WasmMigratedWalletTransactionDataFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmmigratedwallettransactiondata_free(ptr >>> 0, 1));

export class WasmMigratedWalletTransactionData {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmMigratedWalletTransactionData.prototype);
        obj.__wbg_ptr = ptr;
        WasmMigratedWalletTransactionDataFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    static __unwrap(jsValue) {
        if (!(jsValue instanceof WasmMigratedWalletTransactionData)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmMigratedWalletTransactionDataFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmmigratedwallettransactiondata_free(ptr, 0);
    }
    /**
     * @returns {WasmMigratedWalletTransaction}
     */
    get Data() {
        const ret = wasm.__wbg_get_wasmmigratedwallettransactiondata_Data(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {WasmMigratedWalletTransaction} arg0
     */
    set Data(arg0) {
        wasm.__wbg_set_wasmmigratedwallettransactiondata_Data(this.__wbg_ptr, arg0);
    }
}

const WasmMigratedWalletTransactionsFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmmigratedwallettransactions_free(ptr >>> 0, 1));

export class WasmMigratedWalletTransactions {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmMigratedWalletTransactionsFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmmigratedwallettransactions_free(ptr, 0);
    }
    /**
     * @returns {WasmMigratedWalletTransactionData[]}
     */
    get 0() {
        const ret = wasm.__wbg_get_wasmmigratedwallettransactions_0(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @param {WasmMigratedWalletTransactionData[]} arg0
     */
    set 0(arg0) {
        const ptr0 = passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmmigratedwallettransactions_0(this.__wbg_ptr, ptr0, len0);
    }
    constructor() {
        const ret = wasm.wasmmigratedwallettransactions_new();
        this.__wbg_ptr = ret >>> 0;
        WasmMigratedWalletTransactionsFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {WasmMigratedWalletTransaction} account_data
     */
    push(account_data) {
        wasm.wasmmigratedwallettransactions_push(this.__wbg_ptr, account_data);
    }
}

const WasmMinimumFeesFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmminimumfees_free(ptr >>> 0, 1));

export class WasmMinimumFees {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmMinimumFees.prototype);
        obj.__wbg_ptr = ptr;
        WasmMinimumFeesFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmMinimumFeesFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmminimumfees_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get MinimumBroadcastFee() {
        const ret = wasm.__wbg_get_wasmminimumfees_MinimumBroadcastFee(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set MinimumBroadcastFee(arg0) {
        wasm.__wbg_set_wasmminimumfees_MinimumBroadcastFee(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {number}
     */
    get MinimumIncrementalFee() {
        const ret = wasm.__wbg_get_wasmminimumfees_MinimumIncrementalFee(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set MinimumIncrementalFee(arg0) {
        wasm.__wbg_set_wasmminimumfees_MinimumIncrementalFee(this.__wbg_ptr, arg0);
    }
}

const WasmMnemonicFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmmnemonic_free(ptr >>> 0, 1));

export class WasmMnemonic {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmMnemonic.prototype);
        obj.__wbg_ptr = ptr;
        WasmMnemonicFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmMnemonicFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmmnemonic_free(ptr, 0);
    }
    /**
     * Generates a Mnemonic with a random entropy based on the given word
     * count.
     * @param {WasmWordCount} word_count
     */
    constructor(word_count) {
        const ret = wasm.wasmmnemonic_new(word_count);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0] >>> 0;
        WasmMnemonicFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Parse a Mnemonic with the given string.
     * @param {string} mnemonic
     * @returns {WasmMnemonic}
     */
    static fromString(mnemonic) {
        const ptr0 = passStringToWasm0(mnemonic, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmmnemonic_fromString(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmMnemonic.__wrap(ret[0]);
    }
    /**
     * Returns the Mnemonic as a string.
     * @returns {string}
     */
    asString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.wasmmnemonic_asString(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string[]}
     */
    asWords() {
        const ret = wasm.wasmmnemonic_asWords(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
}

const WasmNetworkClientFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmnetworkclient_free(ptr >>> 0, 1));

export class WasmNetworkClient {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmNetworkClient.prototype);
        obj.__wbg_ptr = ptr;
        WasmNetworkClientFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmNetworkClientFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmnetworkclient_free(ptr, 0);
    }
    /**
     * @returns {Promise<WasmNetwork>}
     */
    getNetwork() {
        const ret = wasm.wasmnetworkclient_getNetwork(this.__wbg_ptr);
        return ret;
    }
}

const WasmOnchainPaymentLinkFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmonchainpaymentlink_free(ptr >>> 0, 1));

export class WasmOnchainPaymentLink {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmOnchainPaymentLink.prototype);
        obj.__wbg_ptr = ptr;
        WasmOnchainPaymentLinkFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmOnchainPaymentLinkFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmonchainpaymentlink_free(ptr, 0);
    }
    /**
     * @returns {string | undefined}
     */
    get address() {
        const ret = wasm.__wbg_get_wasmonchainpaymentlink_address(this.__wbg_ptr);
        let v1;
        if (ret[0] !== 0) {
            v1 = getStringFromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        }
        return v1;
    }
    /**
     * @param {string | null} [arg0]
     */
    set address(arg0) {
        var ptr0 = isLikeNone(arg0) ? 0 : passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmonchainpaymentlink_address(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @returns {bigint | undefined}
     */
    get amount() {
        const ret = wasm.__wbg_get_wasmonchainpaymentlink_amount(this.__wbg_ptr);
        return ret[0] === 0 ? undefined : BigInt.asUintN(64, ret[1]);
    }
    /**
     * @param {bigint | null} [arg0]
     */
    set amount(arg0) {
        wasm.__wbg_set_wasmonchainpaymentlink_amount(this.__wbg_ptr, !isLikeNone(arg0), isLikeNone(arg0) ? BigInt(0) : arg0);
    }
    /**
     * @returns {string | undefined}
     */
    get message() {
        const ret = wasm.__wbg_get_wasmonchainpaymentlink_message(this.__wbg_ptr);
        let v1;
        if (ret[0] !== 0) {
            v1 = getStringFromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        }
        return v1;
    }
    /**
     * @param {string | null} [arg0]
     */
    set message(arg0) {
        var ptr0 = isLikeNone(arg0) ? 0 : passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmonchainpaymentlink_message(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @returns {string | undefined}
     */
    get label() {
        const ret = wasm.__wbg_get_wasmonchainpaymentlink_label(this.__wbg_ptr);
        let v1;
        if (ret[0] !== 0) {
            v1 = getStringFromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        }
        return v1;
    }
    /**
     * @param {string | null} [arg0]
     */
    set label(arg0) {
        var ptr0 = isLikeNone(arg0) ? 0 : passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmonchainpaymentlink_label(this.__wbg_ptr, ptr0, len0);
    }
}

const WasmOutPointFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmoutpoint_free(ptr >>> 0, 1));
/**
 * Serialised Outpoint under the form <txid>:<index>
 */
export class WasmOutPoint {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmOutPoint.prototype);
        obj.__wbg_ptr = ptr;
        WasmOutPointFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmOutPointFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmoutpoint_free(ptr, 0);
    }
    /**
     * @returns {string}
     */
    get 0() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.__wbg_get_wasmoutpoint_0(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {string} arg0
     */
    set 0(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmoutpoint_0(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @param {string} str
     * @returns {WasmOutPoint}
     */
    static fromString(str) {
        const ptr0 = passStringToWasm0(str, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmoutpoint_fromString(ptr0, len0);
        return WasmOutPoint.__wrap(ret);
    }
}

const WasmPaperAccountFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmpaperaccount_free(ptr >>> 0, 1));
/**
 * A representation of a paper wallet account
 */
export class WasmPaperAccount {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmPaperAccount.prototype);
        obj.__wbg_ptr = ptr;
        WasmPaperAccountFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmPaperAccountFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmpaperaccount_free(ptr, 0);
    }
    /**
     * @param {WasmNetwork} network
     * @param {WasmScriptType} script_type
     * @returns {WasmPaperAccount}
     */
    static generate(network, script_type) {
        const ret = wasm.wasmpaperaccount_generate(network, script_type);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmPaperAccount.__wrap(ret[0]);
    }
    /**
     * @param {string} wif
     * @param {WasmScriptType} script_type
     * @param {WasmNetwork | null} [network]
     * @returns {WasmPaperAccount}
     */
    static newFrom(wif, script_type, network) {
        const ptr0 = passStringToWasm0(wif, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmpaperaccount_newFrom(ptr0, len0, script_type, isLikeNone(network) ? 4 : network);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmPaperAccount.__wrap(ret[0]);
    }
    /**
     * @returns {Promise<string>}
     */
    geWif() {
        const ret = wasm.wasmpaperaccount_geWif(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {Promise<string>}
     */
    getWifAddress() {
        const ret = wasm.wasmpaperaccount_getWifAddress(this.__wbg_ptr);
        return ret;
    }
}

const WasmPaymentGatewayClientFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmpaymentgatewayclient_free(ptr >>> 0, 1));

export class WasmPaymentGatewayClient {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmPaymentGatewayClient.prototype);
        obj.__wbg_ptr = ptr;
        WasmPaymentGatewayClientFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmPaymentGatewayClientFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmpaymentgatewayclient_free(ptr, 0);
    }
    /**
     * @returns {Promise<WasmCountriesByProvider>}
     */
    getCountries() {
        const ret = wasm.wasmpaymentgatewayclient_getCountries(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {Promise<WasmFiatCurrenciesByProvider>}
     */
    getFiatCurrencies() {
        const ret = wasm.wasmpaymentgatewayclient_getFiatCurrencies(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {string} fiat_currency
     * @returns {Promise<WasmPaymentMethodsByProvider>}
     */
    getPaymentMethods(fiat_currency) {
        const ptr0 = passStringToWasm0(fiat_currency, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmpaymentgatewayclient_getPaymentMethods(this.__wbg_ptr, ptr0, len0);
        return ret;
    }
    /**
     * @param {number} amount
     * @param {string} fiat_currency
     * @param {WasmPaymentMethod | null} [payment_method]
     * @param {WasmGatewayProvider | null} [provider]
     * @returns {Promise<WasmQuotesByProvider>}
     */
    getQuotes(amount, fiat_currency, payment_method, provider) {
        const ptr0 = passStringToWasm0(fiat_currency, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmpaymentgatewayclient_getQuotes(this.__wbg_ptr, amount, ptr0, len0, isLikeNone(payment_method) ? 0 : addToExternrefTable0(payment_method), isLikeNone(provider) ? 0 : addToExternrefTable0(provider));
        return ret;
    }
    /**
     * @param {string} amount
     * @param {string} btc_address
     * @param {string} fiat_currency
     * @param {WasmPaymentMethod} payment_method
     * @param {WasmGatewayProvider} provider
     * @param {string} order_id
     * @returns {Promise<string>}
     */
    createOnRampCheckout(amount, btc_address, fiat_currency, payment_method, provider, order_id) {
        const ptr0 = passStringToWasm0(amount, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(btc_address, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(fiat_currency, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passStringToWasm0(order_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len3 = WASM_VECTOR_LEN;
        const ret = wasm.wasmpaymentgatewayclient_createOnRampCheckout(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2, payment_method, provider, ptr3, len3);
        return ret;
    }
    /**
     * @param {string} url
     * @param {WasmGatewayProvider} provider
     * @returns {Promise<string>}
     */
    signUrl(url, provider) {
        const ptr0 = passStringToWasm0(url, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmpaymentgatewayclient_signUrl(this.__wbg_ptr, ptr0, len0, provider);
        return ret;
    }
    /**
     * @param {WasmGatewayProvider} provider
     * @returns {Promise<string>}
     */
    getPublicApiKey(provider) {
        const ret = wasm.wasmpaymentgatewayclient_getPublicApiKey(this.__wbg_ptr, provider);
        return ret;
    }
    /**
     * @param {number} amount
     * @param {string} address
     * @param {string} fiat_currency
     * @param {WasmPaymentMethod} payment_method
     * @param {WasmGatewayProvider} provider
     * @returns {string}
     */
    getCheckoutIframeSrc(amount, address, fiat_currency, payment_method, provider) {
        let deferred3_0;
        let deferred3_1;
        try {
            const ptr0 = passStringToWasm0(address, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passStringToWasm0(fiat_currency, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            const ret = wasm.wasmpaymentgatewayclient_getCheckoutIframeSrc(this.__wbg_ptr, amount, ptr0, len0, ptr1, len1, payment_method, provider);
            deferred3_0 = ret[0];
            deferred3_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
        }
    }
}

const WasmPaymentLinkFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmpaymentlink_free(ptr >>> 0, 1));

export class WasmPaymentLink {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmPaymentLink.prototype);
        obj.__wbg_ptr = ptr;
        WasmPaymentLinkFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmPaymentLinkFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmpaymentlink_free(ptr, 0);
    }
    /**
     * @returns {string}
     */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.wasmpaymentlink_toString(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    toUri() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.wasmpaymentlink_toUri(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {string} str
     * @param {WasmNetwork} network
     * @returns {WasmPaymentLink}
     */
    static tryParse(str, network) {
        const ptr0 = passStringToWasm0(str, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmpaymentlink_tryParse(ptr0, len0, network);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmPaymentLink.__wrap(ret[0]);
    }
    /**
     * @returns {WasmPaymentLinkKind}
     */
    getKind() {
        const ret = wasm.wasmpaymentlink_getKind(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {WasmOnchainPaymentLink}
     */
    assumeOnchain() {
        const ret = wasm.wasmpaymentlink_assumeOnchain(this.__wbg_ptr);
        return WasmOnchainPaymentLink.__wrap(ret);
    }
}

const WasmPaymentMethodsAndProviderTuppleFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmpaymentmethodsandprovidertupple_free(ptr >>> 0, 1));

export class WasmPaymentMethodsAndProviderTupple {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmPaymentMethodsAndProviderTupple.prototype);
        obj.__wbg_ptr = ptr;
        WasmPaymentMethodsAndProviderTuppleFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    static __unwrap(jsValue) {
        if (!(jsValue instanceof WasmPaymentMethodsAndProviderTupple)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmPaymentMethodsAndProviderTuppleFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmpaymentmethodsandprovidertupple_free(ptr, 0);
    }
    /**
     * @returns {WasmGatewayProvider}
     */
    get 0() {
        const ret = wasm.__wbg_get_wasmpaymentmethodsandprovidertupple_0(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {WasmGatewayProvider} arg0
     */
    set 0(arg0) {
        wasm.__wbg_set_wasmpaymentmethodsandprovidertupple_0(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {WasmPaymentMethods}
     */
    get 1() {
        const ret = wasm.__wbg_get_wasmpaymentmethodsandprovidertupple_1(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {WasmPaymentMethods} arg0
     */
    set 1(arg0) {
        wasm.__wbg_set_wasmpaymentmethodsandprovidertupple_1(this.__wbg_ptr, arg0);
    }
}

const WasmPaymentMethodsByProviderFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmpaymentmethodsbyprovider_free(ptr >>> 0, 1));

export class WasmPaymentMethodsByProvider {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmPaymentMethodsByProvider.prototype);
        obj.__wbg_ptr = ptr;
        WasmPaymentMethodsByProviderFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmPaymentMethodsByProviderFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmpaymentmethodsbyprovider_free(ptr, 0);
    }
    /**
     * @returns {WasmPaymentMethodsAndProviderTupple[]}
     */
    get data() {
        const ret = wasm.__wbg_get_wasmpaymentmethodsbyprovider_data(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @param {WasmPaymentMethodsAndProviderTupple[]} arg0
     */
    set data(arg0) {
        const ptr0 = passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmpaymentmethodsbyprovider_data(this.__wbg_ptr, ptr0, len0);
    }
}

const WasmPriceGraphClientFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmpricegraphclient_free(ptr >>> 0, 1));

export class WasmPriceGraphClient {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmPriceGraphClient.prototype);
        obj.__wbg_ptr = ptr;
        WasmPriceGraphClientFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmPriceGraphClientFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmpricegraphclient_free(ptr, 0);
    }
    /**
     * @param {WasmFiatCurrencySymbol} fiat_currency
     * @param {WasmTimeframe} timeframe
     * @returns {Promise<WasmWrappedPriceGraph>}
     */
    getGraphData(fiat_currency, timeframe) {
        const ret = wasm.wasmpricegraphclient_getGraphData(this.__wbg_ptr, fiat_currency, timeframe);
        return ret;
    }
}

const WasmProtonWalletApiClientFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmprotonwalletapiclient_free(ptr >>> 0, 1));

export class WasmProtonWalletApiClient {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmProtonWalletApiClientFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmprotonwalletapiclient_free(ptr, 0);
    }
    /**
     * @param {string} app_version
     * @param {string} user_agent
     * @param {string | null} [uid_str]
     * @param {string | null} [origin]
     * @param {string | null} [url_prefix]
     */
    constructor(app_version, user_agent, uid_str, origin, url_prefix) {
        const ptr0 = passStringToWasm0(app_version, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(user_agent, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        var ptr2 = isLikeNone(uid_str) ? 0 : passStringToWasm0(uid_str, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len2 = WASM_VECTOR_LEN;
        var ptr3 = isLikeNone(origin) ? 0 : passStringToWasm0(origin, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len3 = WASM_VECTOR_LEN;
        var ptr4 = isLikeNone(url_prefix) ? 0 : passStringToWasm0(url_prefix, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len4 = WASM_VECTOR_LEN;
        const ret = wasm.wasmprotonwalletapiclient_new(ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0] >>> 0;
        WasmProtonWalletApiClientFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {WasmApiClients}
     */
    clients() {
        const ret = wasm.wasmprotonwalletapiclient_clients(this.__wbg_ptr);
        return WasmApiClients.__wrap(ret);
    }
}

const WasmPsbtFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmpsbt_free(ptr >>> 0, 1));

export class WasmPsbt {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmPsbt.prototype);
        obj.__wbg_ptr = ptr;
        WasmPsbtFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmPsbtFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmpsbt_free(ptr, 0);
    }
    /**
     * @returns {WasmPsbtRecipient[]}
     */
    get recipients() {
        const ret = wasm.__wbg_get_wasmpsbt_recipients(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @param {WasmPsbtRecipient[]} arg0
     */
    set recipients(arg0) {
        const ptr0 = passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmpsbt_recipients(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @returns {bigint}
     */
    get total_fees() {
        const ret = wasm.__wbg_get_wasmpsbt_total_fees(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * @param {bigint} arg0
     */
    set total_fees(arg0) {
        wasm.__wbg_set_wasmpsbt_total_fees(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {bigint}
     */
    get outputs_amount() {
        const ret = wasm.__wbg_get_wasmpsbt_outputs_amount(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * @param {bigint} arg0
     */
    set outputs_amount(arg0) {
        wasm.__wbg_set_wasmpsbt_outputs_amount(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {string | undefined}
     */
    get public_address() {
        const ret = wasm.__wbg_get_wasmpsbt_public_address(this.__wbg_ptr);
        let v1;
        if (ret[0] !== 0) {
            v1 = getStringFromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        }
        return v1;
    }
    /**
     * @param {string | null} [arg0]
     */
    set public_address(arg0) {
        var ptr0 = isLikeNone(arg0) ? 0 : passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmpsbt_public_address(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @param {WasmAccount} wasm_account
     * @param {WasmNetwork} network
     * @returns {Promise<WasmPsbt>}
     */
    sign(wasm_account, network) {
        _assertClass(wasm_account, WasmAccount);
        const ret = wasm.wasmpsbt_sign(this.__wbg_ptr, wasm_account.__wbg_ptr, network);
        return ret;
    }
    /**
     * @returns {bigint}
     */
    computeTxVbytes() {
        const ret = wasm.wasmpsbt_computeTxVbytes(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return BigInt.asUintN(64, ret[0]);
    }
}

const WasmPsbtAndTxBuilderFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmpsbtandtxbuilder_free(ptr >>> 0, 1));

export class WasmPsbtAndTxBuilder {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmPsbtAndTxBuilderFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmpsbtandtxbuilder_free(ptr, 0);
    }
    /**
     * @returns {WasmPsbt}
     */
    get 0() {
        const ret = wasm.__wbg_get_wasmpsbtandtxbuilder_0(this.__wbg_ptr);
        return WasmPsbt.__wrap(ret);
    }
    /**
     * @param {WasmPsbt} arg0
     */
    set 0(arg0) {
        _assertClass(arg0, WasmPsbt);
        var ptr0 = arg0.__destroy_into_raw();
        wasm.__wbg_set_wasmpsbtandtxbuilder_0(this.__wbg_ptr, ptr0);
    }
    /**
     * @returns {WasmTxBuilder}
     */
    get 1() {
        const ret = wasm.__wbg_get_wasmpsbtandtxbuilder_1(this.__wbg_ptr);
        return WasmTxBuilder.__wrap(ret);
    }
    /**
     * @param {WasmTxBuilder} arg0
     */
    set 1(arg0) {
        _assertClass(arg0, WasmTxBuilder);
        var ptr0 = arg0.__destroy_into_raw();
        wasm.__wbg_set_wasmpsbtandtxbuilder_1(this.__wbg_ptr, ptr0);
    }
}

const WasmPsbtRecipientFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmpsbtrecipient_free(ptr >>> 0, 1));

export class WasmPsbtRecipient {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmPsbtRecipient.prototype);
        obj.__wbg_ptr = ptr;
        WasmPsbtRecipientFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    static __unwrap(jsValue) {
        if (!(jsValue instanceof WasmPsbtRecipient)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmPsbtRecipientFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmpsbtrecipient_free(ptr, 0);
    }
    /**
     * @returns {string}
     */
    get 0() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.__wbg_get_wasmpsbtrecipient_0(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {string} arg0
     */
    set 0(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmpsbtrecipient_0(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @returns {bigint}
     */
    get 1() {
        const ret = wasm.__wbg_get_wasmpsbt_total_fees(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * @param {bigint} arg0
     */
    set 1(arg0) {
        wasm.__wbg_set_wasmpsbt_total_fees(this.__wbg_ptr, arg0);
    }
}

const WasmQuotesAndProviderTuppleFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmquotesandprovidertupple_free(ptr >>> 0, 1));

export class WasmQuotesAndProviderTupple {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmQuotesAndProviderTupple.prototype);
        obj.__wbg_ptr = ptr;
        WasmQuotesAndProviderTuppleFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    static __unwrap(jsValue) {
        if (!(jsValue instanceof WasmQuotesAndProviderTupple)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmQuotesAndProviderTuppleFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmquotesandprovidertupple_free(ptr, 0);
    }
    /**
     * @returns {WasmGatewayProvider}
     */
    get 0() {
        const ret = wasm.__wbg_get_wasmquotesandprovidertupple_0(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {WasmGatewayProvider} arg0
     */
    set 0(arg0) {
        wasm.__wbg_set_wasmquotesandprovidertupple_0(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {WasmQuotes}
     */
    get 1() {
        const ret = wasm.__wbg_get_wasmquotesandprovidertupple_1(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {WasmQuotes} arg0
     */
    set 1(arg0) {
        wasm.__wbg_set_wasmquotesandprovidertupple_1(this.__wbg_ptr, arg0);
    }
}

const WasmQuotesByProviderFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmquotesbyprovider_free(ptr >>> 0, 1));

export class WasmQuotesByProvider {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmQuotesByProvider.prototype);
        obj.__wbg_ptr = ptr;
        WasmQuotesByProviderFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmQuotesByProviderFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmquotesbyprovider_free(ptr, 0);
    }
    /**
     * @returns {WasmQuotesAndProviderTupple[]}
     */
    get data() {
        const ret = wasm.__wbg_get_wasmquotesbyprovider_data(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @param {WasmQuotesAndProviderTupple[]} arg0
     */
    set data(arg0) {
        const ptr0 = passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmquotesbyprovider_data(this.__wbg_ptr, ptr0, len0);
    }
}

const WasmRecipientFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmrecipient_free(ptr >>> 0, 1));

export class WasmRecipient {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmRecipient.prototype);
        obj.__wbg_ptr = ptr;
        WasmRecipientFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmRecipientFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmrecipient_free(ptr, 0);
    }
    /**
     * @returns {string}
     */
    get 0() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.__wbg_get_wasmrecipient_0(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {string} arg0
     */
    set 0(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmpsbtrecipient_0(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @returns {string}
     */
    get 1() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.__wbg_get_wasmrecipient_1(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {string} arg0
     */
    set 1(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmrecipient_1(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @returns {bigint}
     */
    get 2() {
        const ret = wasm.__wbg_get_wasmpsbt_total_fees(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * @param {bigint} arg0
     */
    set 2(arg0) {
        wasm.__wbg_set_wasmpsbt_total_fees(this.__wbg_ptr, arg0);
    }
}

const WasmRecommendedFeesFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmrecommendedfees_free(ptr >>> 0, 1));

export class WasmRecommendedFees {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmRecommendedFees.prototype);
        obj.__wbg_ptr = ptr;
        WasmRecommendedFeesFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmRecommendedFeesFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmrecommendedfees_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get FastestFee() {
        const ret = wasm.__wbg_get_wasmrecommendedfees_FastestFee(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set FastestFee(arg0) {
        wasm.__wbg_set_wasmrecommendedfees_FastestFee(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {number}
     */
    get HalfHourFee() {
        const ret = wasm.__wbg_get_wasmrecommendedfees_HalfHourFee(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set HalfHourFee(arg0) {
        wasm.__wbg_set_wasmrecommendedfees_HalfHourFee(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {number}
     */
    get HourFee() {
        const ret = wasm.__wbg_get_wasmrecommendedfees_HourFee(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set HourFee(arg0) {
        wasm.__wbg_set_wasmrecommendedfees_HourFee(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {number}
     */
    get EconomyFee() {
        const ret = wasm.__wbg_get_wasmrecommendedfees_EconomyFee(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set EconomyFee(arg0) {
        wasm.__wbg_set_wasmrecommendedfees_EconomyFee(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {number}
     */
    get MinimumFee() {
        const ret = wasm.__wbg_get_wasmrecommendedfees_MinimumFee(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set MinimumFee(arg0) {
        wasm.__wbg_set_wasmrecommendedfees_MinimumFee(this.__wbg_ptr, arg0);
    }
}

const WasmRemainingMonthlyInvitationsFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmremainingmonthlyinvitations_free(ptr >>> 0, 1));

export class WasmRemainingMonthlyInvitations {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmRemainingMonthlyInvitations.prototype);
        obj.__wbg_ptr = ptr;
        WasmRemainingMonthlyInvitationsFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmRemainingMonthlyInvitationsFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmremainingmonthlyinvitations_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get Available() {
        const ret = wasm.__wbg_get_wasmremainingmonthlyinvitations_Available(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set Available(arg0) {
        wasm.__wbg_set_wasmremainingmonthlyinvitations_Available(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {number}
     */
    get Used() {
        const ret = wasm.__wbg_get_wasmremainingmonthlyinvitations_Used(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set Used(arg0) {
        wasm.__wbg_set_wasmremainingmonthlyinvitations_Used(this.__wbg_ptr, arg0);
    }
}

const WasmScriptFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmscript_free(ptr >>> 0, 1));

export class WasmScript {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmScript.prototype);
        obj.__wbg_ptr = ptr;
        WasmScriptFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmScriptFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmscript_free(ptr, 0);
    }
    /**
     * @returns {Uint8Array}
     */
    get 0() {
        const ret = wasm.__wbg_get_wasmscript_0(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @param {Uint8Array} arg0
     */
    set 0(arg0) {
        const ptr0 = passArray8ToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmoutpoint_0(this.__wbg_ptr, ptr0, len0);
    }
    /**
     * @param {WasmNetwork} network
     * @returns {WasmAddress}
     */
    toAddress(network) {
        const ret = wasm.wasmscript_toAddress(this.__wbg_ptr, network);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmAddress.__wrap(ret[0]);
    }
}

const WasmSequenceFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmsequence_free(ptr >>> 0, 1));

export class WasmSequence {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmSequence.prototype);
        obj.__wbg_ptr = ptr;
        WasmSequenceFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmSequenceFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmsequence_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get 0() {
        const ret = wasm.__wbg_get_wasmsequence_0(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {number} arg0
     */
    set 0(arg0) {
        wasm.__wbg_set_wasmsequence_0(this.__wbg_ptr, arg0);
    }
}

const WasmSettingsClientFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmsettingsclient_free(ptr >>> 0, 1));

export class WasmSettingsClient {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmSettingsClient.prototype);
        obj.__wbg_ptr = ptr;
        WasmSettingsClientFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmSettingsClientFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmsettingsclient_free(ptr, 0);
    }
    /**
     * @returns {Promise<WasmUserSettingsData>}
     */
    getUserSettings() {
        const ret = wasm.wasmsettingsclient_getUserSettings(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {WasmBitcoinUnit} symbol
     * @returns {Promise<WasmUserSettingsData>}
     */
    setBitcoinUnit(symbol) {
        const ret = wasm.wasmsettingsclient_setBitcoinUnit(this.__wbg_ptr, symbol);
        return ret;
    }
    /**
     * @param {WasmFiatCurrencySymbol} symbol
     * @returns {Promise<WasmUserSettingsData>}
     */
    setFiatCurrency(symbol) {
        const ret = wasm.wasmsettingsclient_setFiatCurrency(this.__wbg_ptr, symbol);
        return ret;
    }
    /**
     * @param {bigint} amount
     * @returns {Promise<WasmUserSettingsData>}
     */
    setTwoFaThreshold(amount) {
        const ret = wasm.wasmsettingsclient_setTwoFaThreshold(this.__wbg_ptr, amount);
        return ret;
    }
    /**
     * @param {boolean} hide_empty_used_addresses
     * @returns {Promise<WasmUserSettingsData>}
     */
    setHideEmptyUsedAddresses(hide_empty_used_addresses) {
        const ret = wasm.wasmsettingsclient_setHideEmptyUsedAddresses(this.__wbg_ptr, hide_empty_used_addresses);
        return ret;
    }
    /**
     * @param {WasmUserReceiveNotificationEmailTypes} email_type
     * @param {boolean} is_enable
     * @returns {Promise<WasmUserSettingsData>}
     */
    setReceiveNotificationEmail(email_type, is_enable) {
        const ret = wasm.wasmsettingsclient_setReceiveNotificationEmail(this.__wbg_ptr, email_type, is_enable);
        return ret;
    }
    /**
     * @returns {Promise<WasmUserSettingsData>}
     */
    acceptTermsAndConditions() {
        const ret = wasm.wasmsettingsclient_acceptTermsAndConditions(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {Promise<number>}
     */
    getUserWalletEligibility() {
        const ret = wasm.wasmsettingsclient_getUserWalletEligibility(this.__wbg_ptr);
        return ret;
    }
}

const WasmTransactionFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmtransaction_free(ptr >>> 0, 1));

export class WasmTransaction {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmTransaction.prototype);
        obj.__wbg_ptr = ptr;
        WasmTransactionFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmTransactionFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmtransaction_free(ptr, 0);
    }
    /**
     * @param {WasmPsbt} value
     * @returns {WasmTransaction}
     */
    static fromPsbt(value) {
        _assertClass(value, WasmPsbt);
        var ptr0 = value.__destroy_into_raw();
        const ret = wasm.wasmtransaction_fromPsbt(ptr0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTransaction.__wrap(ret[0]);
    }
}

const WasmTransactionDetailsArrayFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmtransactiondetailsarray_free(ptr >>> 0, 1));

export class WasmTransactionDetailsArray {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmTransactionDetailsArray.prototype);
        obj.__wbg_ptr = ptr;
        WasmTransactionDetailsArrayFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmTransactionDetailsArrayFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmtransactiondetailsarray_free(ptr, 0);
    }
    /**
     * @returns {WasmTransactionDetailsData[]}
     */
    get 0() {
        const ret = wasm.__wbg_get_wasmtransactiondetailsarray_0(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @param {WasmTransactionDetailsData[]} arg0
     */
    set 0(arg0) {
        const ptr0 = passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmtransactiondetailsarray_0(this.__wbg_ptr, ptr0, len0);
    }
}

const WasmTransactionDetailsDataFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmtransactiondetailsdata_free(ptr >>> 0, 1));

export class WasmTransactionDetailsData {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmTransactionDetailsData.prototype);
        obj.__wbg_ptr = ptr;
        WasmTransactionDetailsDataFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    static __unwrap(jsValue) {
        if (!(jsValue instanceof WasmTransactionDetailsData)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmTransactionDetailsDataFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmtransactiondetailsdata_free(ptr, 0);
    }
    /**
     * @returns {WasmTransactionDetails}
     */
    get Data() {
        const ret = wasm.__wbg_get_wasmtransactiondetailsdata_Data(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {WasmTransactionDetails} arg0
     */
    set Data(arg0) {
        wasm.__wbg_set_wasmtransactiondetailsdata_Data(this.__wbg_ptr, arg0);
    }
}

const WasmTxBuilderFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmtxbuilder_free(ptr >>> 0, 1));

export class WasmTxBuilder {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmTxBuilder.prototype);
        obj.__wbg_ptr = ptr;
        WasmTxBuilderFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmTxBuilderFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmtxbuilder_free(ptr, 0);
    }
    constructor() {
        const ret = wasm.wasmtxbuilder_new();
        this.__wbg_ptr = ret >>> 0;
        WasmTxBuilderFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {WasmAccount} account
     * @returns {WasmTxBuilder}
     */
    setAccount(account) {
        _assertClass(account, WasmAccount);
        const ret = wasm.wasmtxbuilder_setAccount(this.__wbg_ptr, account.__wbg_ptr);
        return WasmTxBuilder.__wrap(ret);
    }
    /**
     * @returns {Promise<WasmTxBuilder>}
     */
    constrainRecipientAmounts() {
        const ret = wasm.wasmtxbuilder_constrainRecipientAmounts(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {WasmTxBuilder}
     */
    clearRecipients() {
        const ret = wasm.wasmtxbuilder_clearRecipients(this.__wbg_ptr);
        return WasmTxBuilder.__wrap(ret);
    }
    /**
     * @param {string | null} [address_str]
     * @param {bigint | null} [amount]
     * @returns {WasmTxBuilder}
     */
    addRecipient(address_str, amount) {
        var ptr0 = isLikeNone(address_str) ? 0 : passStringToWasm0(address_str, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmtxbuilder_addRecipient(this.__wbg_ptr, ptr0, len0, !isLikeNone(amount), isLikeNone(amount) ? BigInt(0) : amount);
        return WasmTxBuilder.__wrap(ret);
    }
    /**
     * @param {number} index
     * @returns {WasmTxBuilder}
     */
    removeRecipient(index) {
        const ret = wasm.wasmtxbuilder_removeRecipient(this.__wbg_ptr, index);
        return WasmTxBuilder.__wrap(ret);
    }
    /**
     * @param {number} index
     * @param {string | null} [address_str]
     * @param {bigint | null} [amount]
     * @returns {WasmTxBuilder}
     */
    updateRecipient(index, address_str, amount) {
        var ptr0 = isLikeNone(address_str) ? 0 : passStringToWasm0(address_str, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmtxbuilder_updateRecipient(this.__wbg_ptr, index, ptr0, len0, !isLikeNone(amount), isLikeNone(amount) ? BigInt(0) : amount);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTxBuilder.__wrap(ret[0]);
    }
    /**
     * @param {number} index
     * @returns {Promise<WasmTxBuilder>}
     */
    updateRecipientAmountToMax(index) {
        const ret = wasm.wasmtxbuilder_updateRecipientAmountToMax(this.__wbg_ptr, index);
        return ret;
    }
    /**
     * @returns {WasmRecipient[]}
     */
    getRecipients() {
        const ret = wasm.wasmtxbuilder_getRecipients(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     *
     *     * UTXOs
     *
     * @param {WasmOutPoint} outpoint
     * @returns {WasmTxBuilder}
     */
    addUtxoToSpend(outpoint) {
        _assertClass(outpoint, WasmOutPoint);
        var ptr0 = outpoint.__destroy_into_raw();
        const ret = wasm.wasmtxbuilder_addUtxoToSpend(this.__wbg_ptr, ptr0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTxBuilder.__wrap(ret[0]);
    }
    /**
     * @param {WasmOutPoint} outpoint
     * @returns {WasmTxBuilder}
     */
    removeUtxoToSpend(outpoint) {
        _assertClass(outpoint, WasmOutPoint);
        var ptr0 = outpoint.__destroy_into_raw();
        const ret = wasm.wasmtxbuilder_removeUtxoToSpend(this.__wbg_ptr, ptr0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmTxBuilder.__wrap(ret[0]);
    }
    /**
     * @returns {WasmTxBuilder}
     */
    clearUtxosToSpend() {
        const ret = wasm.wasmtxbuilder_clearUtxosToSpend(this.__wbg_ptr);
        return WasmTxBuilder.__wrap(ret);
    }
    /**
     * @returns {WasmOutPoint[]}
     */
    getUtxosToSpend() {
        const ret = wasm.wasmtxbuilder_getUtxosToSpend(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     *
     *     * Coin selection enforcement
     *
     * @param {WasmCoinSelection} coin_selection
     * @returns {WasmTxBuilder}
     */
    setCoinSelection(coin_selection) {
        const ret = wasm.wasmtxbuilder_setCoinSelection(this.__wbg_ptr, coin_selection);
        return WasmTxBuilder.__wrap(ret);
    }
    /**
     * @returns {WasmCoinSelection}
     */
    getCoinSelection() {
        const ret = wasm.wasmtxbuilder_getCoinSelection(this.__wbg_ptr);
        return ret;
    }
    /**
     *
     *     * RBF
     *
     * @returns {WasmTxBuilder}
     */
    enableRbf() {
        const ret = wasm.wasmtxbuilder_enableRbf(this.__wbg_ptr);
        return WasmTxBuilder.__wrap(ret);
    }
    /**
     * @returns {WasmTxBuilder}
     */
    disableRbf() {
        const ret = wasm.wasmtxbuilder_disableRbf(this.__wbg_ptr);
        return WasmTxBuilder.__wrap(ret);
    }
    /**
     * @returns {boolean}
     */
    getRbfEnabled() {
        const ret = wasm.wasmtxbuilder_getRbfEnabled(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     *
     *     * Change policy
     *
     * @param {WasmChangeSpendPolicy} change_policy
     * @returns {WasmTxBuilder}
     */
    setChangePolicy(change_policy) {
        const ret = wasm.wasmtxbuilder_setChangePolicy(this.__wbg_ptr, change_policy);
        return WasmTxBuilder.__wrap(ret);
    }
    /**
     * @returns {WasmChangeSpendPolicy}
     */
    getChangePolicy() {
        const ret = wasm.wasmtxbuilder_getChangePolicy(this.__wbg_ptr);
        return ret;
    }
    /**
     *
     *     * Fees
     *
     * @param {bigint} sat_per_vb
     * @returns {WasmTxBuilder}
     */
    setFeeRate(sat_per_vb) {
        const ret = wasm.wasmtxbuilder_setFeeRate(this.__wbg_ptr, sat_per_vb);
        return WasmTxBuilder.__wrap(ret);
    }
    /**
     * @returns {bigint | undefined}
     */
    getFeeRate() {
        const ret = wasm.wasmtxbuilder_getFeeRate(this.__wbg_ptr);
        return ret[0] === 0 ? undefined : BigInt.asUintN(64, ret[1]);
    }
    /**
     *
     *     * Locktime
     *
     * @param {WasmLockTime} locktime
     * @returns {WasmTxBuilder}
     */
    addLocktime(locktime) {
        _assertClass(locktime, WasmLockTime);
        var ptr0 = locktime.__destroy_into_raw();
        const ret = wasm.wasmtxbuilder_addLocktime(this.__wbg_ptr, ptr0);
        return WasmTxBuilder.__wrap(ret);
    }
    /**
     * @returns {WasmTxBuilder}
     */
    removeLocktime() {
        const ret = wasm.wasmtxbuilder_removeLocktime(this.__wbg_ptr);
        return WasmTxBuilder.__wrap(ret);
    }
    /**
     * @returns {WasmLockTime | undefined}
     */
    getLocktime() {
        const ret = wasm.wasmtxbuilder_getLocktime(this.__wbg_ptr);
        return ret === 0 ? undefined : WasmLockTime.__wrap(ret);
    }
    /**
     *
     *     * Final
     *
     * @param {WasmNetwork} network
     * @returns {Promise<WasmPsbt>}
     */
    createPsbt(network) {
        const ret = wasm.wasmtxbuilder_createPsbt(this.__wbg_ptr, network);
        return ret;
    }
    /**
     * @param {WasmNetwork} network
     * @param {boolean | null} [allow_dust]
     * @returns {Promise<WasmPsbt>}
     */
    createDraftPsbt(network, allow_dust) {
        const ret = wasm.wasmtxbuilder_createDraftPsbt(this.__wbg_ptr, network, isLikeNone(allow_dust) ? 0xFFFFFF : allow_dust ? 1 : 0);
        return ret;
    }
}

const WasmTxOutFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmtxout_free(ptr >>> 0, 1));

export class WasmTxOut {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmTxOut.prototype);
        obj.__wbg_ptr = ptr;
        WasmTxOutFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmTxOutFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmtxout_free(ptr, 0);
    }
    /**
     * @returns {bigint}
     */
    get value() {
        const ret = wasm.__wbg_get_wasmtxout_value(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * @param {bigint} arg0
     */
    set value(arg0) {
        wasm.__wbg_set_wasmtxout_value(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {WasmScript}
     */
    get script_pubkey() {
        const ret = wasm.__wbg_get_wasmtxout_script_pubkey(this.__wbg_ptr);
        return WasmScript.__wrap(ret);
    }
    /**
     * @param {WasmScript} arg0
     */
    set script_pubkey(arg0) {
        _assertClass(arg0, WasmScript);
        var ptr0 = arg0.__destroy_into_raw();
        wasm.__wbg_set_wasmtxout_script_pubkey(this.__wbg_ptr, ptr0);
    }
    /**
     * @returns {boolean}
     */
    get is_mine() {
        const ret = wasm.__wbg_get_wasmtxout_is_mine(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @param {boolean} arg0
     */
    set is_mine(arg0) {
        wasm.__wbg_set_wasmtxout_is_mine(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {string | undefined}
     */
    get address() {
        const ret = wasm.__wbg_get_wasmtxout_address(this.__wbg_ptr);
        let v1;
        if (ret[0] !== 0) {
            v1 = getStringFromWasm0(ret[0], ret[1]).slice();
            wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        }
        return v1;
    }
    /**
     * @param {string | null} [arg0]
     */
    set address(arg0) {
        var ptr0 = isLikeNone(arg0) ? 0 : passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmtxout_address(this.__wbg_ptr, ptr0, len0);
    }
}

const WasmUserSettingsDataFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmusersettingsdata_free(ptr >>> 0, 1));

export class WasmUserSettingsData {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmUserSettingsData.prototype);
        obj.__wbg_ptr = ptr;
        WasmUserSettingsDataFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmUserSettingsDataFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmusersettingsdata_free(ptr, 0);
    }
    /**
     * @returns {WasmUserSettings}
     */
    get 0() {
        const ret = wasm.__wbg_get_wasmusersettingsdata_0(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {WasmUserSettings} arg0
     */
    set 0(arg0) {
        wasm.__wbg_set_wasmusersettingsdata_0(this.__wbg_ptr, arg0);
    }
}

const WasmUtxoFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmutxo_free(ptr >>> 0, 1));

export class WasmUtxo {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmUtxo.prototype);
        obj.__wbg_ptr = ptr;
        WasmUtxoFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    static __unwrap(jsValue) {
        if (!(jsValue instanceof WasmUtxo)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmUtxoFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmutxo_free(ptr, 0);
    }
    /**
     * @returns {bigint}
     */
    get value() {
        const ret = wasm.__wbg_get_wasmutxo_value(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
     * @param {bigint} arg0
     */
    set value(arg0) {
        wasm.__wbg_set_wasmutxo_value(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {WasmOutPoint}
     */
    get outpoint() {
        const ret = wasm.__wbg_get_wasmutxo_outpoint(this.__wbg_ptr);
        return WasmOutPoint.__wrap(ret);
    }
    /**
     * @param {WasmOutPoint} arg0
     */
    set outpoint(arg0) {
        _assertClass(arg0, WasmOutPoint);
        var ptr0 = arg0.__destroy_into_raw();
        wasm.__wbg_set_wasmutxo_outpoint(this.__wbg_ptr, ptr0);
    }
    /**
     * @returns {WasmScript}
     */
    get script_pubkey() {
        const ret = wasm.__wbg_get_wasmutxo_script_pubkey(this.__wbg_ptr);
        return WasmScript.__wrap(ret);
    }
    /**
     * @param {WasmScript} arg0
     */
    set script_pubkey(arg0) {
        _assertClass(arg0, WasmScript);
        var ptr0 = arg0.__destroy_into_raw();
        wasm.__wbg_set_wasmutxo_script_pubkey(this.__wbg_ptr, ptr0);
    }
    /**
     * @returns {WasmKeychainKind}
     */
    get keychain() {
        const ret = wasm.__wbg_get_wasmutxo_keychain(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {WasmKeychainKind} arg0
     */
    set keychain(arg0) {
        wasm.__wbg_set_wasmutxo_keychain(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {boolean}
     */
    get is_spent() {
        const ret = wasm.__wbg_get_wasmutxo_is_spent(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @param {boolean} arg0
     */
    set is_spent(arg0) {
        wasm.__wbg_set_wasmutxo_is_spent(this.__wbg_ptr, arg0);
    }
}

const WasmUtxoArrayFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmutxoarray_free(ptr >>> 0, 1));

export class WasmUtxoArray {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmUtxoArray.prototype);
        obj.__wbg_ptr = ptr;
        WasmUtxoArrayFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmUtxoArrayFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmutxoarray_free(ptr, 0);
    }
    /**
     * @returns {WasmUtxo[]}
     */
    get 0() {
        const ret = wasm.__wbg_get_wasmutxoarray_0(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @param {WasmUtxo[]} arg0
     */
    set 0(arg0) {
        const ptr0 = passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmutxoarray_0(this.__wbg_ptr, ptr0, len0);
    }
}

const WasmWalletFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmwallet_free(ptr >>> 0, 1));

export class WasmWallet {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmWalletFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmwallet_free(ptr, 0);
    }
    /**
     * @param {WasmNetwork} network
     * @param {string} bip39_mnemonic
     * @param {string | null} [bip38_passphrase]
     */
    constructor(network, bip39_mnemonic, bip38_passphrase) {
        const ptr0 = passStringToWasm0(bip39_mnemonic, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        var ptr1 = isLikeNone(bip38_passphrase) ? 0 : passStringToWasm0(bip38_passphrase, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        const ret = wasm.wasmwallet_new(network, ptr0, len0, ptr1, len1);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0] >>> 0;
        WasmWalletFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {number} script_type
     * @param {string} derivation_path
     * @returns {WasmAccount}
     */
    addAccount(script_type, derivation_path) {
        const ptr0 = passStringToWasm0(derivation_path, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmwallet_addAccount(this.__wbg_ptr, script_type, ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return WasmAccount.__wrap(ret[0]);
    }
    /**
     * @param {WasmProtonWalletApiClient} api_client
     * @returns {Promise<WasmDiscoveredAccounts>}
     */
    discoverAccounts(api_client) {
        _assertClass(api_client, WasmProtonWalletApiClient);
        const ret = wasm.wasmwallet_discoverAccounts(this.__wbg_ptr, api_client.__wbg_ptr);
        return ret;
    }
    /**
     * @param {string} derivation_path
     * @returns {WasmAccount | undefined}
     */
    getAccount(derivation_path) {
        const ptr0 = passStringToWasm0(derivation_path, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmwallet_getAccount(this.__wbg_ptr, ptr0, len0);
        return ret === 0 ? undefined : WasmAccount.__wrap(ret);
    }
    /**
     * @returns {Promise<WasmBalanceWrapper>}
     */
    getBalance() {
        const ret = wasm.wasmwallet_getBalance(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {WasmPagination | null} [pagination]
     * @param {WasmSortOrder | null} [sort]
     * @returns {Promise<WasmTransactionDetailsArray>}
     */
    getTransactions(pagination, sort) {
        const ret = wasm.wasmwallet_getTransactions(this.__wbg_ptr, isLikeNone(pagination) ? 0 : addToExternrefTable0(pagination), isLikeNone(sort) ? 2 : sort);
        return ret;
    }
    /**
     * @param {WasmDerivationPath} account_key
     * @param {string} txid
     * @returns {Promise<WasmTransactionDetailsData>}
     */
    getTransaction(account_key, txid) {
        _assertClass(account_key, WasmDerivationPath);
        const ptr0 = passStringToWasm0(txid, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmwallet_getTransaction(this.__wbg_ptr, account_key.__wbg_ptr, ptr0, len0);
        return ret;
    }
    /**
     * @returns {string}
     */
    getFingerprint() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.wasmwallet_getFingerprint(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {Promise<void>}
     */
    clearStore() {
        const ret = wasm.wasmwallet_clearStore(this.__wbg_ptr);
        return ret;
    }
}

const WasmWalletAccountAddressDataFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmwalletaccountaddressdata_free(ptr >>> 0, 1));

export class WasmWalletAccountAddressData {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmWalletAccountAddressData.prototype);
        obj.__wbg_ptr = ptr;
        WasmWalletAccountAddressDataFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    static __unwrap(jsValue) {
        if (!(jsValue instanceof WasmWalletAccountAddressData)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmWalletAccountAddressDataFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmwalletaccountaddressdata_free(ptr, 0);
    }
    /**
     * @returns {WasmApiEmailAddress}
     */
    get Data() {
        const ret = wasm.__wbg_get_wasmwalletaccountaddressdata_Data(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {WasmApiEmailAddress} arg0
     */
    set Data(arg0) {
        wasm.__wbg_set_wasmwalletaccountaddressdata_Data(this.__wbg_ptr, arg0);
    }
}

const WasmWalletAccountDataFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmwalletaccountdata_free(ptr >>> 0, 1));

export class WasmWalletAccountData {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmWalletAccountData.prototype);
        obj.__wbg_ptr = ptr;
        WasmWalletAccountDataFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    static __unwrap(jsValue) {
        if (!(jsValue instanceof WasmWalletAccountData)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmWalletAccountDataFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmwalletaccountdata_free(ptr, 0);
    }
    /**
     * @returns {WasmApiWalletAccount}
     */
    get Data() {
        const ret = wasm.__wbg_get_wasmwalletaccountdata_Data(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {WasmApiWalletAccount} arg0
     */
    set Data(arg0) {
        wasm.__wbg_set_wasmwalletaccountdata_Data(this.__wbg_ptr, arg0);
    }
}

const WasmWalletClientFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmwalletclient_free(ptr >>> 0, 1));

export class WasmWalletClient {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmWalletClient.prototype);
        obj.__wbg_ptr = ptr;
        WasmWalletClientFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmWalletClientFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmwalletclient_free(ptr, 0);
    }
    /**
     * @returns {Promise<WasmApiWalletsData>}
     */
    getWallets() {
        const ret = wasm.wasmwalletclient_getWallets(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {string} name
     * @param {boolean} is_imported
     * @param {number} wallet_type
     * @param {boolean} has_passphrase
     * @param {string} user_key_id
     * @param {string} wallet_key
     * @param {string} wallet_key_signature
     * @param {string | null} [mnemonic]
     * @param {string | null} [fingerprint]
     * @param {string | null} [public_key]
     * @param {boolean | null} [is_auto_created]
     * @returns {Promise<WasmApiWalletData>}
     */
    createWallet(name, is_imported, wallet_type, has_passphrase, user_key_id, wallet_key, wallet_key_signature, mnemonic, fingerprint, public_key, is_auto_created) {
        const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(user_key_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(wallet_key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passStringToWasm0(wallet_key_signature, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len3 = WASM_VECTOR_LEN;
        var ptr4 = isLikeNone(mnemonic) ? 0 : passStringToWasm0(mnemonic, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len4 = WASM_VECTOR_LEN;
        var ptr5 = isLikeNone(fingerprint) ? 0 : passStringToWasm0(fingerprint, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len5 = WASM_VECTOR_LEN;
        var ptr6 = isLikeNone(public_key) ? 0 : passStringToWasm0(public_key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len6 = WASM_VECTOR_LEN;
        const ret = wasm.wasmwalletclient_createWallet(this.__wbg_ptr, ptr0, len0, is_imported, wallet_type, has_passphrase, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4, ptr5, len5, ptr6, len6, isLikeNone(is_auto_created) ? 0xFFFFFF : is_auto_created ? 1 : 0);
        return ret;
    }
    /**
     * @param {string} wallet_id
     * @param {WasmMigratedWallet} migrated_wallet
     * @param {WasmMigratedWalletAccounts} migrated_wallet_accounts
     * @param {WasmMigratedWalletTransactions} migrated_wallet_transactions
     * @returns {Promise<void>}
     */
    migrate(wallet_id, migrated_wallet, migrated_wallet_accounts, migrated_wallet_transactions) {
        const ptr0 = passStringToWasm0(wallet_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        _assertClass(migrated_wallet_accounts, WasmMigratedWalletAccounts);
        var ptr1 = migrated_wallet_accounts.__destroy_into_raw();
        _assertClass(migrated_wallet_transactions, WasmMigratedWalletTransactions);
        var ptr2 = migrated_wallet_transactions.__destroy_into_raw();
        const ret = wasm.wasmwalletclient_migrate(this.__wbg_ptr, ptr0, len0, migrated_wallet, ptr1, ptr2);
        return ret;
    }
    /**
     * @param {string} wallet_id
     * @param {string} name
     * @returns {Promise<void>}
     */
    updateWalletName(wallet_id, name) {
        const ptr0 = passStringToWasm0(wallet_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.wasmwalletclient_updateWalletName(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return ret;
    }
    /**
     * @param {string} wallet_id
     * @returns {Promise<void>}
     */
    disableShowWalletRecovery(wallet_id) {
        const ptr0 = passStringToWasm0(wallet_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmwalletclient_disableShowWalletRecovery(this.__wbg_ptr, ptr0, len0);
        return ret;
    }
    /**
     * @param {string} wallet_id
     * @param {string} wallet_account_id
     * @param {boolean} has_positive_balance
     * @returns {Promise<void>}
     */
    sendWalletAccountMetrics(wallet_id, wallet_account_id, has_positive_balance) {
        const ptr0 = passStringToWasm0(wallet_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(wallet_account_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.wasmwalletclient_sendWalletAccountMetrics(this.__wbg_ptr, ptr0, len0, ptr1, len1, has_positive_balance);
        return ret;
    }
    /**
     * @param {string} wallet_id
     * @returns {Promise<void>}
     */
    deleteWallet(wallet_id) {
        const ptr0 = passStringToWasm0(wallet_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmwalletclient_deleteWallet(this.__wbg_ptr, ptr0, len0);
        return ret;
    }
    /**
     * @param {string} wallet_id
     * @returns {Promise<WasmApiWalletAccounts>}
     */
    getWalletAccounts(wallet_id) {
        const ptr0 = passStringToWasm0(wallet_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmwalletclient_getWalletAccounts(this.__wbg_ptr, ptr0, len0);
        return ret;
    }
    /**
     * @param {string} wallet_id
     * @param {string} wallet_account_id
     * @returns {Promise<WasmApiWalletAccountAddresses>}
     */
    getWalletAccountAddresses(wallet_id, wallet_account_id) {
        const ptr0 = passStringToWasm0(wallet_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(wallet_account_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.wasmwalletclient_getWalletAccountAddresses(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return ret;
    }
    /**
     * @param {string} wallet_id
     * @param {WasmDerivationPath} derivation_path
     * @param {string} label
     * @param {WasmScriptType} script_type
     * @returns {Promise<WasmWalletAccountData>}
     */
    createWalletAccount(wallet_id, derivation_path, label, script_type) {
        const ptr0 = passStringToWasm0(wallet_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        _assertClass(derivation_path, WasmDerivationPath);
        var ptr1 = derivation_path.__destroy_into_raw();
        const ptr2 = passStringToWasm0(label, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ret = wasm.wasmwalletclient_createWalletAccount(this.__wbg_ptr, ptr0, len0, ptr1, ptr2, len2, script_type);
        return ret;
    }
    /**
     * @param {string} wallet_id
     * @param {string} wallet_account_id
     * @param {WasmFiatCurrencySymbol} symbol
     * @returns {Promise<WasmWalletAccountData>}
     */
    updateWalletAccountFiatCurrency(wallet_id, wallet_account_id, symbol) {
        const ptr0 = passStringToWasm0(wallet_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(wallet_account_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.wasmwalletclient_updateWalletAccountFiatCurrency(this.__wbg_ptr, ptr0, len0, ptr1, len1, symbol);
        return ret;
    }
    /**
     * @param {string} wallet_id
     * @param {string} wallet_account_id
     * @param {string} label
     * @returns {Promise<WasmWalletAccountData>}
     */
    updateWalletAccountLabel(wallet_id, wallet_account_id, label) {
        const ptr0 = passStringToWasm0(wallet_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(wallet_account_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(label, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ret = wasm.wasmwalletclient_updateWalletAccountLabel(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2);
        return ret;
    }
    /**
     * @param {string} wallet_id
     * @param {string[]} wallet_account_ids
     * @returns {Promise<WasmApiWalletAccounts>}
     */
    updateWalletAccountsOrder(wallet_id, wallet_account_ids) {
        const ptr0 = passStringToWasm0(wallet_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArrayJsValueToWasm0(wallet_account_ids, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.wasmwalletclient_updateWalletAccountsOrder(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return ret;
    }
    /**
     * @param {string} wallet_id
     * @param {string} wallet_account_id
     * @param {number} last_used_index
     * @returns {Promise<WasmWalletAccountData>}
     */
    updateWalletAccountLastUsedIndex(wallet_id, wallet_account_id, last_used_index) {
        const ptr0 = passStringToWasm0(wallet_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(wallet_account_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.wasmwalletclient_updateWalletAccountLastUsedIndex(this.__wbg_ptr, ptr0, len0, ptr1, len1, last_used_index);
        return ret;
    }
    /**
     * @param {string} wallet_id
     * @param {string} wallet_account_id
     * @param {number} stop_gap
     * @returns {Promise<WasmWalletAccountData>}
     */
    updateWalletAccountStopGap(wallet_id, wallet_account_id, stop_gap) {
        const ptr0 = passStringToWasm0(wallet_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(wallet_account_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.wasmwalletclient_updateWalletAccountStopGap(this.__wbg_ptr, ptr0, len0, ptr1, len1, stop_gap);
        return ret;
    }
    /**
     * @param {string} wallet_id
     * @param {string} wallet_account_id
     * @param {string} email_address_id
     * @returns {Promise<WasmWalletAccountData>}
     */
    addEmailAddress(wallet_id, wallet_account_id, email_address_id) {
        const ptr0 = passStringToWasm0(wallet_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(wallet_account_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(email_address_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ret = wasm.wasmwalletclient_addEmailAddress(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2);
        return ret;
    }
    /**
     * @param {string} wallet_id
     * @param {string} wallet_account_id
     * @param {string} email_address_id
     * @returns {Promise<WasmWalletAccountData>}
     */
    removeEmailAddress(wallet_id, wallet_account_id, email_address_id) {
        const ptr0 = passStringToWasm0(wallet_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(wallet_account_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(email_address_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ret = wasm.wasmwalletclient_removeEmailAddress(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2);
        return ret;
    }
    /**
     * @param {string} wallet_id
     * @param {string} wallet_account_id
     * @returns {Promise<void>}
     */
    deleteWalletAccount(wallet_id, wallet_account_id) {
        const ptr0 = passStringToWasm0(wallet_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(wallet_account_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.wasmwalletclient_deleteWalletAccount(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return ret;
    }
    /**
     * @param {string} wallet_id
     * @param {string | null} [wallet_account_id]
     * @param {string[] | null} [hashed_txids]
     * @returns {Promise<WasmApiWalletTransactions>}
     */
    getWalletTransactions(wallet_id, wallet_account_id, hashed_txids) {
        const ptr0 = passStringToWasm0(wallet_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        var ptr1 = isLikeNone(wallet_account_id) ? 0 : passStringToWasm0(wallet_account_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        var ptr2 = isLikeNone(hashed_txids) ? 0 : passArrayJsValueToWasm0(hashed_txids, wasm.__wbindgen_malloc);
        var len2 = WASM_VECTOR_LEN;
        const ret = wasm.wasmwalletclient_getWalletTransactions(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2);
        return ret;
    }
    /**
     * @param {string} wallet_id
     * @param {string | null} [wallet_account_id]
     * @returns {Promise<WasmApiWalletTransactions>}
     */
    getWalletTransactionsToHash(wallet_id, wallet_account_id) {
        const ptr0 = passStringToWasm0(wallet_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        var ptr1 = isLikeNone(wallet_account_id) ? 0 : passStringToWasm0(wallet_account_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        const ret = wasm.wasmwalletclient_getWalletTransactionsToHash(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return ret;
    }
    /**
     * @param {string} wallet_id
     * @param {string} wallet_account_id
     * @param {WasmCreateWalletTransactionPayload} payload
     * @returns {Promise<WasmApiWalletTransactionData>}
     */
    createWalletTransaction(wallet_id, wallet_account_id, payload) {
        const ptr0 = passStringToWasm0(wallet_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(wallet_account_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.wasmwalletclient_createWalletTransaction(this.__wbg_ptr, ptr0, len0, ptr1, len1, payload);
        return ret;
    }
    /**
     * @param {string} wallet_id
     * @param {string} wallet_account_id
     * @param {string} wallet_transaction_id
     * @param {string} label
     * @returns {Promise<WasmApiWalletTransactionData>}
     */
    updateWalletTransactionLabel(wallet_id, wallet_account_id, wallet_transaction_id, label) {
        const ptr0 = passStringToWasm0(wallet_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(wallet_account_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(wallet_transaction_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passStringToWasm0(label, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len3 = WASM_VECTOR_LEN;
        const ret = wasm.wasmwalletclient_updateWalletTransactionLabel(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3);
        return ret;
    }
    /**
     * @param {string} wallet_id
     * @param {string} wallet_account_id
     * @param {string} wallet_transaction_id
     * @param {string} hash_txid
     * @returns {Promise<WasmApiWalletTransactionData>}
     */
    updateWalletTransactionHashedTxId(wallet_id, wallet_account_id, wallet_transaction_id, hash_txid) {
        const ptr0 = passStringToWasm0(wallet_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(wallet_account_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(wallet_transaction_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passStringToWasm0(hash_txid, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len3 = WASM_VECTOR_LEN;
        const ret = wasm.wasmwalletclient_updateWalletTransactionHashedTxId(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3);
        return ret;
    }
    /**
     * @param {string} wallet_id
     * @param {string} wallet_account_id
     * @param {string} wallet_transaction_id
     * @param {string} sender
     * @returns {Promise<WasmApiWalletTransactionData>}
     */
    updateExternalWalletTransactionSender(wallet_id, wallet_account_id, wallet_transaction_id, sender) {
        const ptr0 = passStringToWasm0(wallet_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(wallet_account_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(wallet_transaction_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passStringToWasm0(sender, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len3 = WASM_VECTOR_LEN;
        const ret = wasm.wasmwalletclient_updateExternalWalletTransactionSender(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3);
        return ret;
    }
    /**
     * @param {string} wallet_id
     * @param {string} wallet_account_id
     * @param {string} wallet_transaction_id
     * @param {WasmWalletTransactionFlag} flag
     * @returns {Promise<WasmApiWalletTransactionData>}
     */
    setWalletTransactionFlag(wallet_id, wallet_account_id, wallet_transaction_id, flag) {
        const ptr0 = passStringToWasm0(wallet_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(wallet_account_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(wallet_transaction_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ret = wasm.wasmwalletclient_setWalletTransactionFlag(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2, flag);
        return ret;
    }
    /**
     * @param {string} wallet_id
     * @param {string} wallet_account_id
     * @param {string} wallet_transaction_id
     * @param {WasmWalletTransactionFlag} flag
     * @returns {Promise<WasmApiWalletTransactionData>}
     */
    deleteWalletTransactionFlag(wallet_id, wallet_account_id, wallet_transaction_id, flag) {
        const ptr0 = passStringToWasm0(wallet_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(wallet_account_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(wallet_transaction_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ret = wasm.wasmwalletclient_deleteWalletTransactionFlag(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2, flag);
        return ret;
    }
    /**
     * @param {string} wallet_id
     * @param {string} wallet_account_id
     * @param {string} wallet_transaction_id
     * @returns {Promise<void>}
     */
    deleteWalletTransaction(wallet_id, wallet_account_id, wallet_transaction_id) {
        const ptr0 = passStringToWasm0(wallet_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(wallet_account_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(wallet_transaction_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ret = wasm.wasmwalletclient_deleteWalletTransaction(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2);
        return ret;
    }
}

const WasmWrappedPriceGraphFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmwrappedpricegraph_free(ptr >>> 0, 1));

export class WasmWrappedPriceGraph {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmWrappedPriceGraph.prototype);
        obj.__wbg_ptr = ptr;
        WasmWrappedPriceGraphFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmWrappedPriceGraphFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmwrappedpricegraph_free(ptr, 0);
    }
    /**
     * @returns {WasmPriceGraph}
     */
    get data() {
        const ret = wasm.__wbg_get_wasmwrappedpricegraph_data(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {WasmPriceGraph} arg0
     */
    set data(arg0) {
        wasm.__wbg_set_wasmwrappedpricegraph_data(this.__wbg_ptr, arg0);
    }
}

export function __wbg_abort_775ef1d17fc65868(arg0) {
    arg0.abort();
};

export function __wbg_append_8c7dd8d641a5f01b() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
    arg0.append(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
}, arguments) };

export function __wbg_arrayBuffer_d1b44c4390db422f() { return handleError(function (arg0) {
    const ret = arg0.arrayBuffer();
    return ret;
}, arguments) };

export function __wbg_buffer_609cc3eee51ed158(arg0) {
    const ret = arg0.buffer;
    return ret;
};

export function __wbg_call_672a4d21634d4a24() { return handleError(function (arg0, arg1) {
    const ret = arg0.call(arg1);
    return ret;
}, arguments) };

export function __wbg_call_7cccdd69e0791ae2() { return handleError(function (arg0, arg1, arg2) {
    const ret = arg0.call(arg1, arg2);
    return ret;
}, arguments) };

export function __wbg_clearTimeout_96804de0ab838f26(arg0) {
    const ret = clearTimeout(arg0);
    return ret;
};

export function __wbg_crypto_ed58b8e10a292839(arg0) {
    const ret = arg0.crypto;
    return ret;
};

export function __wbg_done_769e5ede4b31c67b(arg0) {
    const ret = arg0.done;
    return ret;
};

export function __wbg_error_7534b8e9a36f1ab4(arg0, arg1) {
    let deferred0_0;
    let deferred0_1;
    try {
        deferred0_0 = arg0;
        deferred0_1 = arg1;
        console.error(getStringFromWasm0(arg0, arg1));
    } finally {
        wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
    }
};

export function __wbg_fetch_4465c2b10f21a927(arg0) {
    const ret = fetch(arg0);
    return ret;
};

export function __wbg_fetch_509096533071c657(arg0, arg1) {
    const ret = arg0.fetch(arg1);
    return ret;
};

export function __wbg_getItem_17f98dee3b43fa7e() { return handleError(function (arg0, arg1, arg2, arg3) {
    const ret = arg1.getItem(getStringFromWasm0(arg2, arg3));
    var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
}, arguments) };

export function __wbg_getRandomValues_0fd9e2d73ca5f48f() { return handleError(function (arg0, arg1) {
    globalThis.crypto.getRandomValues(getArrayU8FromWasm0(arg0, arg1));
}, arguments) };

export function __wbg_getRandomValues_bcb4912f16000dc4() { return handleError(function (arg0, arg1) {
    arg0.getRandomValues(arg1);
}, arguments) };

export function __wbg_get_67b2ba62fc30de12() { return handleError(function (arg0, arg1) {
    const ret = Reflect.get(arg0, arg1);
    return ret;
}, arguments) };

export function __wbg_has_a5ea9117f258a0ec() { return handleError(function (arg0, arg1) {
    const ret = Reflect.has(arg0, arg1);
    return ret;
}, arguments) };

export function __wbg_headers_9cb51cfd2ac780a4(arg0) {
    const ret = arg0.headers;
    return ret;
};

export function __wbg_instanceof_Response_f2cc20d9f7dfd644(arg0) {
    let result;
    try {
        result = arg0 instanceof Response;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_instanceof_Window_def73ea0955fc569(arg0) {
    let result;
    try {
        result = arg0 instanceof Window;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_iterator_9a24c88df860dc65() {
    const ret = Symbol.iterator;
    return ret;
};

export function __wbg_length_a446193dc22c12f8(arg0) {
    const ret = arg0.length;
    return ret;
};

export function __wbg_localStorage_1406c99c39728187() { return handleError(function (arg0) {
    const ret = arg0.localStorage;
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
}, arguments) };

export function __wbg_msCrypto_0a36e2ec3a343d26(arg0) {
    const ret = arg0.msCrypto;
    return ret;
};

export function __wbg_new_018dcc2d6c8c2f6a() { return handleError(function () {
    const ret = new Headers();
    return ret;
}, arguments) };

export function __wbg_new_23a2665fac83c611(arg0, arg1) {
    try {
        var state0 = {a: arg0, b: arg1};
        var cb0 = (arg0, arg1) => {
            const a = state0.a;
            state0.a = 0;
            try {
                return __wbg_adapter_661(a, state0.b, arg0, arg1);
            } finally {
                state0.a = a;
            }
        };
        const ret = new Promise(cb0);
        return ret;
    } finally {
        state0.a = state0.b = 0;
    }
};

export function __wbg_new_405e22f390576ce2() {
    const ret = new Object();
    return ret;
};

export function __wbg_new_5e0be73521bc8c17() {
    const ret = new Map();
    return ret;
};

export function __wbg_new_78feb108b6472713() {
    const ret = new Array();
    return ret;
};

export function __wbg_new_8a6f238a6ece86ea() {
    const ret = new Error();
    return ret;
};

export function __wbg_new_a12002a7f91c75be(arg0) {
    const ret = new Uint8Array(arg0);
    return ret;
};

export function __wbg_new_c68d7209be747379(arg0, arg1) {
    const ret = new Error(getStringFromWasm0(arg0, arg1));
    return ret;
};

export function __wbg_new_e25e5aab09ff45db() { return handleError(function () {
    const ret = new AbortController();
    return ret;
}, arguments) };

export function __wbg_newnoargs_105ed471475aaf50(arg0, arg1) {
    const ret = new Function(getStringFromWasm0(arg0, arg1));
    return ret;
};

export function __wbg_newwithbyteoffsetandlength_d97e637ebe145a9a(arg0, arg1, arg2) {
    const ret = new Uint8Array(arg0, arg1 >>> 0, arg2 >>> 0);
    return ret;
};

export function __wbg_newwithlength_a381634e90c276d4(arg0) {
    const ret = new Uint8Array(arg0 >>> 0);
    return ret;
};

export function __wbg_newwithstrandinit_06c535e0a867c635() { return handleError(function (arg0, arg1, arg2) {
    const ret = new Request(getStringFromWasm0(arg0, arg1), arg2);
    return ret;
}, arguments) };

export function __wbg_next_25feadfc0913fea9(arg0) {
    const ret = arg0.next;
    return ret;
};

export function __wbg_next_6574e1a8a62d1055() { return handleError(function (arg0) {
    const ret = arg0.next();
    return ret;
}, arguments) };

export function __wbg_node_02999533c4ea02e3(arg0) {
    const ret = arg0.node;
    return ret;
};

export function __wbg_now_807e54c39636c349() {
    const ret = Date.now();
    return ret;
};

export function __wbg_process_5c1d670bc53614b8(arg0) {
    const ret = arg0.process;
    return ret;
};

export function __wbg_queueMicrotask_97d92b4fcc8a61c5(arg0) {
    queueMicrotask(arg0);
};

export function __wbg_queueMicrotask_d3219def82552485(arg0) {
    const ret = arg0.queueMicrotask;
    return ret;
};

export function __wbg_randomFillSync_ab2cfe79ebbf2740() { return handleError(function (arg0, arg1) {
    arg0.randomFillSync(arg1);
}, arguments) };

export function __wbg_require_79b1e9274cde3c87() { return handleError(function () {
    const ret = module.require;
    return ret;
}, arguments) };

export function __wbg_resolve_4851785c9c5f573d(arg0) {
    const ret = Promise.resolve(arg0);
    return ret;
};

export function __wbg_setTimeout_eefe7f4c234b0c6b() { return handleError(function (arg0, arg1) {
    const ret = setTimeout(arg0, arg1);
    return ret;
}, arguments) };

export function __wbg_set_37837023f3d740e8(arg0, arg1, arg2) {
    arg0[arg1 >>> 0] = arg2;
};

export function __wbg_set_3f1d0b984ed272ed(arg0, arg1, arg2) {
    arg0[arg1] = arg2;
};

export function __wbg_set_65595bdd868b3009(arg0, arg1, arg2) {
    arg0.set(arg1, arg2 >>> 0);
};

export function __wbg_set_8fc6bf8a5b1071d1(arg0, arg1, arg2) {
    const ret = arg0.set(arg1, arg2);
    return ret;
};

export function __wbg_set_d9a72c1550e3f2b5() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
    arg0[getStringFromWasm0(arg1, arg2)] = getStringFromWasm0(arg3, arg4);
}, arguments) };

export function __wbg_setbody_5923b78a95eedf29(arg0, arg1) {
    arg0.body = arg1;
};

export function __wbg_setcredentials_c3a22f1cd105a2c6(arg0, arg1) {
    arg0.credentials = __wbindgen_enum_RequestCredentials[arg1];
};

export function __wbg_setheaders_834c0bdb6a8949ad(arg0, arg1) {
    arg0.headers = arg1;
};

export function __wbg_setmethod_3c5280fe5d890842(arg0, arg1, arg2) {
    arg0.method = getStringFromWasm0(arg1, arg2);
};

export function __wbg_setmode_5dc300b865044b65(arg0, arg1) {
    arg0.mode = __wbindgen_enum_RequestMode[arg1];
};

export function __wbg_setsignal_75b21ef3a81de905(arg0, arg1) {
    arg0.signal = arg1;
};

export function __wbg_signal_aaf9ad74119f20a4(arg0) {
    const ret = arg0.signal;
    return ret;
};

export function __wbg_stack_0ed75d68575b0f3c(arg0, arg1) {
    const ret = arg1.stack;
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
};

export function __wbg_static_accessor_GLOBAL_88a902d13a557d07() {
    const ret = typeof global === 'undefined' ? null : global;
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
};

export function __wbg_static_accessor_GLOBAL_THIS_56578be7e9f832b0() {
    const ret = typeof globalThis === 'undefined' ? null : globalThis;
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
};

export function __wbg_static_accessor_SELF_37c5d418e4bf5819() {
    const ret = typeof self === 'undefined' ? null : self;
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
};

export function __wbg_static_accessor_WINDOW_5de37043a91a9c40() {
    const ret = typeof window === 'undefined' ? null : window;
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
};

export function __wbg_status_f6360336ca686bf0(arg0) {
    const ret = arg0.status;
    return ret;
};

export function __wbg_stringify_f7ed6987935b4a24() { return handleError(function (arg0) {
    const ret = JSON.stringify(arg0);
    return ret;
}, arguments) };

export function __wbg_subarray_aa9065fa9dc5df96(arg0, arg1, arg2) {
    const ret = arg0.subarray(arg1 >>> 0, arg2 >>> 0);
    return ret;
};

export function __wbg_then_44b73946d2fb3e7d(arg0, arg1) {
    const ret = arg0.then(arg1);
    return ret;
};

export function __wbg_then_48b406749878a531(arg0, arg1, arg2) {
    const ret = arg0.then(arg1, arg2);
    return ret;
};

export function __wbg_url_ae10c34ca209681d(arg0, arg1) {
    const ret = arg1.url;
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
};

export function __wbg_value_cd1ffa7b1ab794f1(arg0) {
    const ret = arg0.value;
    return ret;
};

export function __wbg_versions_c71aa1626a93e0a1(arg0) {
    const ret = arg0.versions;
    return ret;
};

export function __wbg_wasmaddressdetailsarray_new(arg0) {
    const ret = WasmAddressDetailsArray.__wrap(arg0);
    return ret;
};

export function __wbg_wasmaddressdetailsdata_new(arg0) {
    const ret = WasmAddressDetailsData.__wrap(arg0);
    return ret;
};

export function __wbg_wasmaddressdetailsdata_unwrap(arg0) {
    const ret = WasmAddressDetailsData.__unwrap(arg0);
    return ret;
};

export function __wbg_wasmaddressinfo_new(arg0) {
    const ret = WasmAddressInfo.__wrap(arg0);
    return ret;
};

export function __wbg_wasmapibitcoinaddresscreationpayloaddata_new(arg0) {
    const ret = WasmApiBitcoinAddressCreationPayloadData.__wrap(arg0);
    return ret;
};

export function __wbg_wasmapibitcoinaddresscreationpayloaddata_unwrap(arg0) {
    const ret = WasmApiBitcoinAddressCreationPayloadData.__unwrap(arg0);
    return ret;
};

export function __wbg_wasmapiexchangeratedata_new(arg0) {
    const ret = WasmApiExchangeRateData.__wrap(arg0);
    return ret;
};

export function __wbg_wasmapifiatcurrencies_new(arg0) {
    const ret = WasmApiFiatCurrencies.__wrap(arg0);
    return ret;
};

export function __wbg_wasmapifiatcurrencydata_new(arg0) {
    const ret = WasmApiFiatCurrencyData.__wrap(arg0);
    return ret;
};

export function __wbg_wasmapifiatcurrencydata_unwrap(arg0) {
    const ret = WasmApiFiatCurrencyData.__unwrap(arg0);
    return ret;
};

export function __wbg_wasmapiwalletaccountaddresses_new(arg0) {
    const ret = WasmApiWalletAccountAddresses.__wrap(arg0);
    return ret;
};

export function __wbg_wasmapiwalletaccounts_new(arg0) {
    const ret = WasmApiWalletAccounts.__wrap(arg0);
    return ret;
};

export function __wbg_wasmapiwalletbitcoinaddressdata_new(arg0) {
    const ret = WasmApiWalletBitcoinAddressData.__wrap(arg0);
    return ret;
};

export function __wbg_wasmapiwalletbitcoinaddressdata_unwrap(arg0) {
    const ret = WasmApiWalletBitcoinAddressData.__unwrap(arg0);
    return ret;
};

export function __wbg_wasmapiwalletbitcoinaddresses_new(arg0) {
    const ret = WasmApiWalletBitcoinAddresses.__wrap(arg0);
    return ret;
};

export function __wbg_wasmapiwalletbitcoinaddressindexes_new(arg0) {
    const ret = WasmApiWalletBitcoinAddressIndexes.__wrap(arg0);
    return ret;
};

export function __wbg_wasmapiwalletbitcoinaddresslookupdata_new(arg0) {
    const ret = WasmApiWalletBitcoinAddressLookupData.__wrap(arg0);
    return ret;
};

export function __wbg_wasmapiwalletbitcoinaddressusedindexdata_new(arg0) {
    const ret = WasmApiWalletBitcoinAddressUsedIndexData.__wrap(arg0);
    return ret;
};

export function __wbg_wasmapiwalletbitcoinaddressusedindexdata_unwrap(arg0) {
    const ret = WasmApiWalletBitcoinAddressUsedIndexData.__unwrap(arg0);
    return ret;
};

export function __wbg_wasmapiwalletdata_new(arg0) {
    const ret = WasmApiWalletData.__wrap(arg0);
    return ret;
};

export function __wbg_wasmapiwalletdata_unwrap(arg0) {
    const ret = WasmApiWalletData.__unwrap(arg0);
    return ret;
};

export function __wbg_wasmapiwalletsdata_new(arg0) {
    const ret = WasmApiWalletsData.__wrap(arg0);
    return ret;
};

export function __wbg_wasmapiwallettransactiondata_new(arg0) {
    const ret = WasmApiWalletTransactionData.__wrap(arg0);
    return ret;
};

export function __wbg_wasmapiwallettransactiondata_unwrap(arg0) {
    const ret = WasmApiWalletTransactionData.__unwrap(arg0);
    return ret;
};

export function __wbg_wasmapiwallettransactions_new(arg0) {
    const ret = WasmApiWalletTransactions.__wrap(arg0);
    return ret;
};

export function __wbg_wasmbalancewrapper_new(arg0) {
    const ret = WasmBalanceWrapper.__wrap(arg0);
    return ret;
};

export function __wbg_wasmcountriesandprovidertupple_new(arg0) {
    const ret = WasmCountriesAndProviderTupple.__wrap(arg0);
    return ret;
};

export function __wbg_wasmcountriesandprovidertupple_unwrap(arg0) {
    const ret = WasmCountriesAndProviderTupple.__unwrap(arg0);
    return ret;
};

export function __wbg_wasmcountriesbyprovider_new(arg0) {
    const ret = WasmCountriesByProvider.__wrap(arg0);
    return ret;
};

export function __wbg_wasmdiscoveredaccount_new(arg0) {
    const ret = WasmDiscoveredAccount.__wrap(arg0);
    return ret;
};

export function __wbg_wasmdiscoveredaccount_unwrap(arg0) {
    const ret = WasmDiscoveredAccount.__unwrap(arg0);
    return ret;
};

export function __wbg_wasmdiscoveredaccounts_new(arg0) {
    const ret = WasmDiscoveredAccounts.__wrap(arg0);
    return ret;
};

export function __wbg_wasmfiatcurrenciesandprovidertupple_new(arg0) {
    const ret = WasmFiatCurrenciesAndProviderTupple.__wrap(arg0);
    return ret;
};

export function __wbg_wasmfiatcurrenciesandprovidertupple_unwrap(arg0) {
    const ret = WasmFiatCurrenciesAndProviderTupple.__unwrap(arg0);
    return ret;
};

export function __wbg_wasmfiatcurrenciesbyprovider_new(arg0) {
    const ret = WasmFiatCurrenciesByProvider.__wrap(arg0);
    return ret;
};

export function __wbg_wasmmigratedwalletaccountdata_new(arg0) {
    const ret = WasmMigratedWalletAccountData.__wrap(arg0);
    return ret;
};

export function __wbg_wasmmigratedwalletaccountdata_unwrap(arg0) {
    const ret = WasmMigratedWalletAccountData.__unwrap(arg0);
    return ret;
};

export function __wbg_wasmmigratedwallettransactiondata_new(arg0) {
    const ret = WasmMigratedWalletTransactionData.__wrap(arg0);
    return ret;
};

export function __wbg_wasmmigratedwallettransactiondata_unwrap(arg0) {
    const ret = WasmMigratedWalletTransactionData.__unwrap(arg0);
    return ret;
};

export function __wbg_wasmminimumfees_new(arg0) {
    const ret = WasmMinimumFees.__wrap(arg0);
    return ret;
};

export function __wbg_wasmoutpoint_new(arg0) {
    const ret = WasmOutPoint.__wrap(arg0);
    return ret;
};

export function __wbg_wasmpaymentmethodsandprovidertupple_new(arg0) {
    const ret = WasmPaymentMethodsAndProviderTupple.__wrap(arg0);
    return ret;
};

export function __wbg_wasmpaymentmethodsandprovidertupple_unwrap(arg0) {
    const ret = WasmPaymentMethodsAndProviderTupple.__unwrap(arg0);
    return ret;
};

export function __wbg_wasmpaymentmethodsbyprovider_new(arg0) {
    const ret = WasmPaymentMethodsByProvider.__wrap(arg0);
    return ret;
};

export function __wbg_wasmpsbt_new(arg0) {
    const ret = WasmPsbt.__wrap(arg0);
    return ret;
};

export function __wbg_wasmpsbtrecipient_new(arg0) {
    const ret = WasmPsbtRecipient.__wrap(arg0);
    return ret;
};

export function __wbg_wasmpsbtrecipient_unwrap(arg0) {
    const ret = WasmPsbtRecipient.__unwrap(arg0);
    return ret;
};

export function __wbg_wasmquotesandprovidertupple_new(arg0) {
    const ret = WasmQuotesAndProviderTupple.__wrap(arg0);
    return ret;
};

export function __wbg_wasmquotesandprovidertupple_unwrap(arg0) {
    const ret = WasmQuotesAndProviderTupple.__unwrap(arg0);
    return ret;
};

export function __wbg_wasmquotesbyprovider_new(arg0) {
    const ret = WasmQuotesByProvider.__wrap(arg0);
    return ret;
};

export function __wbg_wasmrecipient_new(arg0) {
    const ret = WasmRecipient.__wrap(arg0);
    return ret;
};

export function __wbg_wasmrecommendedfees_new(arg0) {
    const ret = WasmRecommendedFees.__wrap(arg0);
    return ret;
};

export function __wbg_wasmremainingmonthlyinvitations_new(arg0) {
    const ret = WasmRemainingMonthlyInvitations.__wrap(arg0);
    return ret;
};

export function __wbg_wasmtransactiondetailsarray_new(arg0) {
    const ret = WasmTransactionDetailsArray.__wrap(arg0);
    return ret;
};

export function __wbg_wasmtransactiondetailsdata_new(arg0) {
    const ret = WasmTransactionDetailsData.__wrap(arg0);
    return ret;
};

export function __wbg_wasmtransactiondetailsdata_unwrap(arg0) {
    const ret = WasmTransactionDetailsData.__unwrap(arg0);
    return ret;
};

export function __wbg_wasmtxbuilder_new(arg0) {
    const ret = WasmTxBuilder.__wrap(arg0);
    return ret;
};

export function __wbg_wasmusersettingsdata_new(arg0) {
    const ret = WasmUserSettingsData.__wrap(arg0);
    return ret;
};

export function __wbg_wasmutxo_new(arg0) {
    const ret = WasmUtxo.__wrap(arg0);
    return ret;
};

export function __wbg_wasmutxo_unwrap(arg0) {
    const ret = WasmUtxo.__unwrap(arg0);
    return ret;
};

export function __wbg_wasmutxoarray_new(arg0) {
    const ret = WasmUtxoArray.__wrap(arg0);
    return ret;
};

export function __wbg_wasmwalletaccountaddressdata_new(arg0) {
    const ret = WasmWalletAccountAddressData.__wrap(arg0);
    return ret;
};

export function __wbg_wasmwalletaccountaddressdata_unwrap(arg0) {
    const ret = WasmWalletAccountAddressData.__unwrap(arg0);
    return ret;
};

export function __wbg_wasmwalletaccountdata_new(arg0) {
    const ret = WasmWalletAccountData.__wrap(arg0);
    return ret;
};

export function __wbg_wasmwalletaccountdata_unwrap(arg0) {
    const ret = WasmWalletAccountData.__unwrap(arg0);
    return ret;
};

export function __wbg_wasmwrappedpricegraph_new(arg0) {
    const ret = WasmWrappedPriceGraph.__wrap(arg0);
    return ret;
};

export function __wbindgen_bigint_from_i64(arg0) {
    const ret = arg0;
    return ret;
};

export function __wbindgen_bigint_from_u64(arg0) {
    const ret = BigInt.asUintN(64, arg0);
    return ret;
};

export function __wbindgen_cb_drop(arg0) {
    const obj = arg0.original;
    if (obj.cnt-- == 1) {
        obj.a = 0;
        return true;
    }
    const ret = false;
    return ret;
};

export function __wbindgen_closure_wrapper11640(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 2028, __wbg_adapter_40);
    return ret;
};

export function __wbindgen_closure_wrapper12282(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 2102, __wbg_adapter_43);
    return ret;
};

export function __wbindgen_debug_string(arg0, arg1) {
    const ret = debugString(arg1);
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
};

export function __wbindgen_error_new(arg0, arg1) {
    const ret = new Error(getStringFromWasm0(arg0, arg1));
    return ret;
};

export function __wbindgen_init_externref_table() {
    const table = wasm.__wbindgen_export_2;
    const offset = table.grow(4);
    table.set(0, undefined);
    table.set(offset + 0, undefined);
    table.set(offset + 1, null);
    table.set(offset + 2, true);
    table.set(offset + 3, false);
    ;
};

export function __wbindgen_is_function(arg0) {
    const ret = typeof(arg0) === 'function';
    return ret;
};

export function __wbindgen_is_object(arg0) {
    const val = arg0;
    const ret = typeof(val) === 'object' && val !== null;
    return ret;
};

export function __wbindgen_is_string(arg0) {
    const ret = typeof(arg0) === 'string';
    return ret;
};

export function __wbindgen_is_undefined(arg0) {
    const ret = arg0 === undefined;
    return ret;
};

export function __wbindgen_json_parse(arg0, arg1) {
    const ret = JSON.parse(getStringFromWasm0(arg0, arg1));
    return ret;
};

export function __wbindgen_json_serialize(arg0, arg1) {
    const obj = arg1;
    const ret = JSON.stringify(obj === undefined ? null : obj);
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
};

export function __wbindgen_memory() {
    const ret = wasm.memory;
    return ret;
};

export function __wbindgen_number_new(arg0) {
    const ret = arg0;
    return ret;
};

export function __wbindgen_string_get(arg0, arg1) {
    const obj = arg1;
    const ret = typeof(obj) === 'string' ? obj : undefined;
    var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
};

export function __wbindgen_string_new(arg0, arg1) {
    const ret = getStringFromWasm0(arg0, arg1);
    return ret;
};

export function __wbindgen_throw(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
};


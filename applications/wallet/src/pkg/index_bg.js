let wasm;
export function __wbg_set_wasm(val) {
    wasm = val;
}


const heap = new Array(128).fill(undefined);

heap.push(undefined, null, true, false);

function getObject(idx) { return heap[idx]; }

let heap_next = heap.length;

function dropObject(idx) {
    if (idx < 132) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

let WASM_VECTOR_LEN = 0;

let cachedUint8Memory0 = null;

function getUint8Memory0() {
    if (cachedUint8Memory0 === null || cachedUint8Memory0.byteLength === 0) {
        cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8Memory0;
}

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
        getUint8Memory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8Memory0();

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
        const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

let cachedInt32Memory0 = null;

function getInt32Memory0() {
    if (cachedInt32Memory0 === null || cachedInt32Memory0.byteLength === 0) {
        cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
    }
    return cachedInt32Memory0;
}

const lTextDecoder = typeof TextDecoder === 'undefined' ? (0, module.require)('util').TextDecoder : TextDecoder;

let cachedTextDecoder = new lTextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
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
    if (builtInMatches.length > 1) {
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
                wasm.__wbindgen_export_2.get(state.dtor)(a, state.b);

            } else {
                state.a = a;
            }
        }
    };
    real.original = state;

    return real;
}
function __wbg_adapter_32(arg0, arg1, arg2) {
    wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__hb19f5d41ded024e1(arg0, arg1, addHeapObject(arg2));
}

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
    return instance.ptr;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8Memory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}
/**
* @returns {string}
*/
export function library_version() {
    let deferred1_0;
    let deferred1_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.library_version(retptr);
        var r0 = getInt32Memory0()[retptr / 4 + 0];
        var r1 = getInt32Memory0()[retptr / 4 + 1];
        deferred1_0 = r0;
        deferred1_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8Memory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedUint32Memory0 = null;

function getUint32Memory0() {
    if (cachedUint32Memory0 === null || cachedUint32Memory0.byteLength === 0) {
        cachedUint32Memory0 = new Uint32Array(wasm.memory.buffer);
    }
    return cachedUint32Memory0;
}

function getArrayJsValueFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    const mem = getUint32Memory0();
    const slice = mem.subarray(ptr / 4, ptr / 4 + len);
    const result = [];
    for (let i = 0; i < slice.length; i++) {
        result.push(takeObject(slice[i]));
    }
    return result;
}

function passArrayJsValueToWasm0(array, malloc) {
    const ptr = malloc(array.length * 4, 4) >>> 0;
    const mem = getUint32Memory0();
    for (let i = 0; i < array.length; i++) {
        mem[ptr / 4 + i] = addHeapObject(array[i]);
    }
    WASM_VECTOR_LEN = array.length;
    return ptr;
}

let cachedBigInt64Memory0 = null;

function getBigInt64Memory0() {
    if (cachedBigInt64Memory0 === null || cachedBigInt64Memory0.byteLength === 0) {
        cachedBigInt64Memory0 = new BigInt64Array(wasm.memory.buffer);
    }
    return cachedBigInt64Memory0;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        wasm.__wbindgen_exn_store(addHeapObject(e));
    }
}
function __wbg_adapter_227(arg0, arg1, arg2, arg3) {
    wasm.wasm_bindgen__convert__closures__invoke2_mut__h299fbb8d3b3f1d36(arg0, arg1, addHeapObject(arg2), addHeapObject(arg3));
}

/**
*/
export const WasmWordCount = Object.freeze({ Words12:0,"0":"Words12",Words15:1,"1":"Words15",Words18:2,"2":"Words18",Words21:3,"3":"Words21",Words24:4,"4":"Words24", });
/**
*/
export const WasmLanguage = Object.freeze({ English:0,"0":"English",SimplifiedChinese:1,"1":"SimplifiedChinese",TraditionalChinese:2,"2":"TraditionalChinese",Czech:3,"3":"Czech",French:4,"4":"French",Italian:5,"5":"Italian",Japanese:6,"6":"Japanese",Korean:7,"7":"Korean",Spanish:8,"8":"Spanish", });
/**
*/
export const WasmKeychainKind = Object.freeze({
/**
* External keychain, used for deriving recipient addresses.
*/
External:0,"0":"External",
/**
* Internal keychain, used for deriving change addresses.
*/
Internal:1,"1":"Internal", });
/**
*/
export const WasmSupportedBIPs = Object.freeze({ Bip44:0,"0":"Bip44",Bip49:1,"1":"Bip49",Bip84:2,"2":"Bip84",Bip86:3,"3":"Bip86", });
/**
*/
export const WasmNetwork = Object.freeze({
/**
* Mainnet Bitcoin.
*/
Bitcoin:0,"0":"Bitcoin",
/**
* Bitcoin's testnet network.
*/
Testnet:1,"1":"Testnet",
/**
* Bitcoin's signet network.
*/
Signet:2,"2":"Signet",
/**
* Bitcoin's regtest network.
*/
Regtest:3,"3":"Regtest", });
/**
*/
export const WasmError = Object.freeze({ InvalidSecretKey:0,"0":"InvalidSecretKey",InvalidDescriptor:1,"1":"InvalidDescriptor",InvalidDerivationPath:2,"2":"InvalidDerivationPath",InvalidAccountIndex:3,"3":"InvalidAccountIndex",DerivationError:4,"4":"DerivationError",SyncError:5,"5":"SyncError",OutpointParsingError:6,"6":"OutpointParsingError",InvalidData:7,"7":"InvalidData",InvalidTxId:8,"8":"InvalidTxId",CannotComputeTxFees:9,"9":"CannotComputeTxFees",InvalidMnemonic:10,"10":"InvalidMnemonic",InvalidSeed:11,"11":"InvalidSeed",Generic:12,"12":"Generic",NoRecipients:13,"13":"NoRecipients",NoUtxosSelected:14,"14":"NoUtxosSelected",OutputBelowDustLimit:15,"15":"OutputBelowDustLimit",InsufficientFunds:16,"16":"InsufficientFunds",BnBTotalTriesExceeded:17,"17":"BnBTotalTriesExceeded",BnBNoExactMatch:18,"18":"BnBNoExactMatch",UnknownUtxo:19,"19":"UnknownUtxo",TransactionNotFound:20,"20":"TransactionNotFound",TransactionConfirmed:21,"21":"TransactionConfirmed",IrreplaceableTransaction:22,"22":"IrreplaceableTransaction",FeeRateTooLow:23,"23":"FeeRateTooLow",FeeTooLow:24,"24":"FeeTooLow",FeeRateUnavailable:25,"25":"FeeRateUnavailable",MissingKeyOrigin:26,"26":"MissingKeyOrigin",Key:27,"27":"Key",ChecksumMismatch:28,"28":"ChecksumMismatch",SpendingPolicyRequired:29,"29":"SpendingPolicyRequired",InvalidPolicyPathError:30,"30":"InvalidPolicyPathError",Signer:31,"31":"Signer",InvalidOutpoint:32,"32":"InvalidOutpoint",Descriptor:33,"33":"Descriptor",Miniscript:34,"34":"Miniscript",MiniscriptPsbt:35,"35":"MiniscriptPsbt",Bip32:36,"36":"Bip32",Psbt:37,"37":"Psbt", });
/**
*/
export class DetailledWasmError {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(DetailledWasmError.prototype);
        obj.__wbg_ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_detailledwasmerror_free(ptr);
    }
    /**
    * @returns {WasmError}
    */
    get kind() {
        const ret = wasm.__wbg_get_detailledwasmerror_kind(this.__wbg_ptr);
        return ret;
    }
    /**
    * @param {WasmError} arg0
    */
    set kind(arg0) {
        wasm.__wbg_set_detailledwasmerror_kind(this.__wbg_ptr, arg0);
    }
    /**
    * @returns {any}
    */
    get details() {
        const ret = wasm.__wbg_get_detailledwasmerror_details(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @param {any} arg0
    */
    set details(arg0) {
        wasm.__wbg_set_detailledwasmerror_details(this.__wbg_ptr, addHeapObject(arg0));
    }
}
/**
*/
export class ExportedStringVec {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_exportedstringvec_free(ptr);
    }
    /**
    * @param {number} index
    * @returns {string}
    */
    get_name(index) {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.exportedstringvec_get_name(retptr, this.__wbg_ptr, index);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}
/**
*/
export class WasmAccount {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmaccount_free(ptr);
    }
    /**
    * @param {string} mnemonic_str
    * @param {string | undefined} passphrase
    * @param {WasmAccountConfig} config
    */
    constructor(mnemonic_str, passphrase, config) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(mnemonic_str, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            var ptr1 = isLikeNone(passphrase) ? 0 : passStringToWasm0(passphrase, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len1 = WASM_VECTOR_LEN;
            _assertClass(config, WasmAccountConfig);
            var ptr2 = config.__destroy_into_raw();
            wasm.wasmaccount_new(retptr, ptr0, len0, ptr1, len1, ptr2);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            this.__wbg_ptr = r0 >>> 0;
            return this;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @returns {Promise<void>}
    */
    sync() {
        const ret = wasm.wasmaccount_sync(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @returns {WasmBalance}
    */
    get_balance() {
        const ret = wasm.wasmaccount_get_balance(this.__wbg_ptr);
        return WasmBalance.__wrap(ret);
    }
    /**
    * @param {WasmPagination} pagination
    * @returns {(WasmSimpleTransaction)[]}
    */
    get_transactions(pagination) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(pagination, WasmPagination);
            var ptr0 = pagination.__destroy_into_raw();
            wasm.wasmaccount_get_transactions(retptr, this.__wbg_ptr, ptr0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var v2 = getArrayJsValueFromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 4, 4);
            return v2;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}
/**
*/
export class WasmAccountConfig {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmaccountconfig_free(ptr);
    }
    /**
    * @returns {WasmSupportedBIPs}
    */
    get bip() {
        const ret = wasm.__wbg_get_wasmaccountconfig_bip(this.__wbg_ptr);
        return ret;
    }
    /**
    * @param {WasmSupportedBIPs} arg0
    */
    set bip(arg0) {
        wasm.__wbg_set_wasmaccountconfig_bip(this.__wbg_ptr, arg0);
    }
    /**
    * @returns {WasmNetwork}
    */
    get network() {
        const ret = wasm.__wbg_get_wasmaccountconfig_network(this.__wbg_ptr);
        return ret;
    }
    /**
    * @param {WasmNetwork} arg0
    */
    set network(arg0) {
        wasm.__wbg_set_wasmaccountconfig_network(this.__wbg_ptr, arg0);
    }
    /**
    * @returns {number}
    */
    get account_index() {
        const ret = wasm.__wbg_get_wasmaccountconfig_account_index(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
    * @param {number} arg0
    */
    set account_index(arg0) {
        wasm.__wbg_set_wasmaccountconfig_account_index(this.__wbg_ptr, arg0);
    }
    /**
    * @param {WasmSupportedBIPs | undefined} [bip]
    * @param {WasmNetwork | undefined} [network]
    * @param {number | undefined} [account_index]
    */
    constructor(bip, network, account_index) {
        const ret = wasm.wasmaccountconfig_new(isLikeNone(bip) ? 4 : bip, isLikeNone(network) ? 4 : network, !isLikeNone(account_index), isLikeNone(account_index) ? 0 : account_index);
        this.__wbg_ptr = ret >>> 0;
        return this;
    }
}
/**
*/
export class WasmAddressIndex {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmAddressIndex.prototype);
        obj.__wbg_ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmaddressindex_free(ptr);
    }
    /**
    * @returns {WasmAddressIndex}
    */
    static createNew() {
        const ret = wasm.wasmaddressindex_createNew();
        return WasmAddressIndex.__wrap(ret);
    }
    /**
    * @returns {WasmAddressIndex}
    */
    static createLastUnused() {
        const ret = wasm.wasmaddressindex_createLastUnused();
        return WasmAddressIndex.__wrap(ret);
    }
    /**
    * @param {number} index
    * @returns {WasmAddressIndex}
    */
    static createPeek(index) {
        const ret = wasm.wasmaddressindex_createPeek(index);
        return WasmAddressIndex.__wrap(ret);
    }
}
/**
*/
export class WasmAddressInfo {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmaddressinfo_free(ptr);
    }
    /**
    * @returns {number}
    */
    get index() {
        const ret = wasm.wasmaddressinfo_index(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
    * @returns {string}
    */
    to_string() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.wasmaddressinfo_to_string(retptr, this.__wbg_ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}
/**
*/
export class WasmBalance {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmBalance.prototype);
        obj.__wbg_ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmbalance_free(ptr);
    }
    /**
    * All coinbase outputs not yet matured
    * @returns {bigint}
    */
    get immature() {
        const ret = wasm.__wbg_get_wasmbalance_immature(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
    * All coinbase outputs not yet matured
    * @param {bigint} arg0
    */
    set immature(arg0) {
        wasm.__wbg_set_wasmbalance_immature(this.__wbg_ptr, arg0);
    }
    /**
    * Unconfirmed UTXOs generated by a wallet tx
    * @returns {bigint}
    */
    get trusted_pending() {
        const ret = wasm.__wbg_get_wasmbalance_trusted_pending(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
    * Unconfirmed UTXOs generated by a wallet tx
    * @param {bigint} arg0
    */
    set trusted_pending(arg0) {
        wasm.__wbg_set_wasmbalance_trusted_pending(this.__wbg_ptr, arg0);
    }
    /**
    * Unconfirmed UTXOs received from an external wallet
    * @returns {bigint}
    */
    get untrusted_pending() {
        const ret = wasm.__wbg_get_wasmbalance_untrusted_pending(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
    * Unconfirmed UTXOs received from an external wallet
    * @param {bigint} arg0
    */
    set untrusted_pending(arg0) {
        wasm.__wbg_set_wasmbalance_untrusted_pending(this.__wbg_ptr, arg0);
    }
    /**
    * Confirmed and immediately spendable balance
    * @returns {bigint}
    */
    get confirmed() {
        const ret = wasm.__wbg_get_wasmbalance_confirmed(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
    * Confirmed and immediately spendable balance
    * @param {bigint} arg0
    */
    set confirmed(arg0) {
        wasm.__wbg_set_wasmbalance_confirmed(this.__wbg_ptr, arg0);
    }
}
/**
*/
export class WasmBdkMnemonic {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmBdkMnemonic.prototype);
        obj.__wbg_ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmbdkmnemonic_free(ptr);
    }
    /**
    * @returns {WasmLanguage}
    */
    get lang() {
        const ret = wasm.__wbg_get_wasmbdkmnemonic_lang(this.__wbg_ptr);
        return ret;
    }
    /**
    * @param {WasmLanguage} arg0
    */
    set lang(arg0) {
        wasm.__wbg_set_wasmbdkmnemonic_lang(this.__wbg_ptr, arg0);
    }
    /**
    * @returns {string}
    */
    get words() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.__wbg_get_wasmbdkmnemonic_words(retptr, this.__wbg_ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
    * @param {string} arg0
    */
    set words(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmbdkmnemonic_words(this.__wbg_ptr, ptr0, len0);
    }
}
/**
*/
export class WasmConfirmation {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmConfirmation.prototype);
        obj.__wbg_ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmconfirmation_free(ptr);
    }
    /**
    * @returns {boolean}
    */
    get confirmed() {
        const ret = wasm.__wbg_get_wasmconfirmation_confirmed(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * @param {boolean} arg0
    */
    set confirmed(arg0) {
        wasm.__wbg_set_wasmconfirmation_confirmed(this.__wbg_ptr, arg0);
    }
    /**
    * @returns {bigint | undefined}
    */
    get confirmation_time() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.__wbg_get_wasmconfirmation_confirmation_time(retptr, this.__wbg_ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r2 = getBigInt64Memory0()[retptr / 8 + 1];
            return r0 === 0 ? undefined : BigInt.asUintN(64, r2);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {bigint | undefined} [arg0]
    */
    set confirmation_time(arg0) {
        wasm.__wbg_set_wasmconfirmation_confirmation_time(this.__wbg_ptr, !isLikeNone(arg0), isLikeNone(arg0) ? BigInt(0) : arg0);
    }
    /**
    * @returns {bigint | undefined}
    */
    get last_seen() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.__wbg_get_wasmconfirmation_last_seen(retptr, this.__wbg_ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r2 = getBigInt64Memory0()[retptr / 8 + 1];
            return r0 === 0 ? undefined : BigInt.asUintN(64, r2);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {bigint | undefined} [arg0]
    */
    set last_seen(arg0) {
        wasm.__wbg_set_wasmconfirmation_last_seen(this.__wbg_ptr, !isLikeNone(arg0), isLikeNone(arg0) ? BigInt(0) : arg0);
    }
}
/**
*/
export class WasmDerivationPath {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmderivationpath_free(ptr);
    }
    /**
    * @param {string} path
    */
    constructor(path) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(path, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            wasm.wasmderivationpath_new(retptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            this.__wbg_ptr = r0 >>> 0;
            return this;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}
/**
*/
export class WasmLockTime {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmLockTime.prototype);
        obj.__wbg_ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmlocktime_free(ptr);
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
    is_block_height() {
        const ret = wasm.wasmlocktime_is_block_height(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * @returns {boolean}
    */
    is_block_time() {
        const ret = wasm.wasmlocktime_is_block_time(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * @returns {number}
    */
    to_consensus_u32() {
        const ret = wasm.__wbg_get_wasmpagination_take(this.__wbg_ptr);
        return ret >>> 0;
    }
}
/**
*/
export class WasmMnemonic {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmMnemonic.prototype);
        obj.__wbg_ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmmnemonic_free(ptr);
    }
    /**
    * @returns {WasmBdkMnemonic}
    */
    get inner() {
        const ret = wasm.__wbg_get_wasmmnemonic_inner(this.__wbg_ptr);
        return WasmBdkMnemonic.__wrap(ret);
    }
    /**
    * @param {WasmBdkMnemonic} arg0
    */
    set inner(arg0) {
        _assertClass(arg0, WasmBdkMnemonic);
        var ptr0 = arg0.__destroy_into_raw();
        wasm.__wbg_set_wasmmnemonic_inner(this.__wbg_ptr, ptr0);
    }
    /**
    * Generates a Mnemonic with a random entropy based on the given word count.
    * @param {WasmWordCount} word_count
    */
    constructor(word_count) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.wasmmnemonic_new(retptr, word_count);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            this.__wbg_ptr = r0 >>> 0;
            return this;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Parse a Mnemonic with the given string.
    * @param {string} mnemonic
    * @returns {WasmMnemonic}
    */
    static fromString(mnemonic) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(mnemonic, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            wasm.wasmmnemonic_fromString(retptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return WasmMnemonic.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Create a new Mnemonic from the given entropy.
    * @param {Uint8Array} entropy
    * @returns {WasmMnemonic}
    */
    static fromEntropy(entropy) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArray8ToWasm0(entropy, wasm.__wbindgen_malloc);
            const len0 = WASM_VECTOR_LEN;
            wasm.wasmmnemonic_fromEntropy(retptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return WasmMnemonic.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * Returns the Mnemonic as a string.
    * @returns {string}
    */
    asString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.wasmmnemonic_asString(retptr, this.__wbg_ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}
/**
* Serialised Outpoint under the form <txid>:<index>
*/
export class WasmOutPoint {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmOutPoint.prototype);
        obj.__wbg_ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmoutpoint_free(ptr);
    }
}
/**
*/
export class WasmPagination {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmpagination_free(ptr);
    }
    /**
    * @returns {number}
    */
    get skip() {
        const ret = wasm.__wbg_get_wasmpagination_skip(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
    * @param {number} arg0
    */
    set skip(arg0) {
        wasm.__wbg_set_wasmpagination_skip(this.__wbg_ptr, arg0);
    }
    /**
    * @returns {number}
    */
    get take() {
        const ret = wasm.__wbg_get_wasmpagination_take(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
    * @param {number} arg0
    */
    set take(arg0) {
        wasm.__wbg_set_wasmpagination_take(this.__wbg_ptr, arg0);
    }
    /**
    * @param {number} skip
    * @param {number} take
    */
    constructor(skip, take) {
        const ret = wasm.wasmpagination_new(skip, take);
        this.__wbg_ptr = ret >>> 0;
        return this;
    }
}
/**
*/
export class WasmPartiallySignedTransaction {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmPartiallySignedTransaction.prototype);
        obj.__wbg_ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmpartiallysignedtransaction_free(ptr);
    }
}
/**
*/
export class WasmScript {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmScript.prototype);
        obj.__wbg_ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmscript_free(ptr);
    }
    /**
    * @returns {Uint8Array}
    */
    get 0() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.__wbg_get_wasmscript_0(retptr, this.__wbg_ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var v1 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 1, 1);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {Uint8Array} arg0
    */
    set 0(arg0) {
        const ptr0 = passArray8ToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmscript_0(this.__wbg_ptr, ptr0, len0);
    }
}
/**
*/
export class WasmSequence {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmSequence.prototype);
        obj.__wbg_ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmsequence_free(ptr);
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
/**
*/
export class WasmSimpleTransaction {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmSimpleTransaction.prototype);
        obj.__wbg_ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmsimpletransaction_free(ptr);
    }
    /**
    * @returns {string}
    */
    get txid() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.__wbg_get_wasmsimpletransaction_txid(retptr, this.__wbg_ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
    * @param {string} arg0
    */
    set txid(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmsimpletransaction_txid(this.__wbg_ptr, ptr0, len0);
    }
    /**
    * @returns {bigint}
    */
    get value() {
        const ret = wasm.__wbg_get_wasmsimpletransaction_value(this.__wbg_ptr);
        return ret;
    }
    /**
    * @param {bigint} arg0
    */
    set value(arg0) {
        wasm.__wbg_set_wasmsimpletransaction_value(this.__wbg_ptr, arg0);
    }
    /**
    * @returns {bigint | undefined}
    */
    get fees() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.__wbg_get_wasmconfirmation_confirmation_time(retptr, this.__wbg_ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r2 = getBigInt64Memory0()[retptr / 8 + 1];
            return r0 === 0 ? undefined : BigInt.asUintN(64, r2);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {bigint | undefined} [arg0]
    */
    set fees(arg0) {
        wasm.__wbg_set_wasmconfirmation_confirmation_time(this.__wbg_ptr, !isLikeNone(arg0), isLikeNone(arg0) ? BigInt(0) : arg0);
    }
    /**
    * @returns {WasmConfirmation}
    */
    get confirmation() {
        const ret = wasm.__wbg_get_wasmsimpletransaction_confirmation(this.__wbg_ptr);
        return WasmConfirmation.__wrap(ret);
    }
    /**
    * @param {WasmConfirmation} arg0
    */
    set confirmation(arg0) {
        _assertClass(arg0, WasmConfirmation);
        var ptr0 = arg0.__destroy_into_raw();
        wasm.__wbg_set_wasmsimpletransaction_confirmation(this.__wbg_ptr, ptr0);
    }
}
/**
*/
export class WasmTransaction {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmtransaction_free(ptr);
    }
    /**
    * @returns {number}
    */
    get version() {
        const ret = wasm.__wbg_get_wasmtransaction_version(this.__wbg_ptr);
        return ret;
    }
    /**
    * @param {number} arg0
    */
    set version(arg0) {
        wasm.__wbg_set_wasmtransaction_version(this.__wbg_ptr, arg0);
    }
    /**
    * @returns {WasmLockTime}
    */
    get lock_time() {
        const ret = wasm.__wbg_get_wasmtransaction_lock_time(this.__wbg_ptr);
        return WasmLockTime.__wrap(ret);
    }
    /**
    * @param {WasmLockTime} arg0
    */
    set lock_time(arg0) {
        _assertClass(arg0, WasmLockTime);
        var ptr0 = arg0.__destroy_into_raw();
        wasm.__wbg_set_wasmtransaction_lock_time(this.__wbg_ptr, ptr0);
    }
    /**
    * @returns {(WasmTxIn)[]}
    */
    get input() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.__wbg_get_wasmtransaction_input(retptr, this.__wbg_ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var v1 = getArrayJsValueFromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 4, 4);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {(WasmTxIn)[]} arg0
    */
    set input(arg0) {
        const ptr0 = passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmtransaction_input(this.__wbg_ptr, ptr0, len0);
    }
    /**
    * @returns {(WasmTxOut)[]}
    */
    get output() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.__wbg_get_wasmtransaction_output(retptr, this.__wbg_ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var v1 = getArrayJsValueFromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 4, 4);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {(WasmTxOut)[]} arg0
    */
    set output(arg0) {
        const ptr0 = passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmtransaction_output(this.__wbg_ptr, ptr0, len0);
    }
}
/**
*/
export class WasmTxBuilder {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmTxBuilder.prototype);
        obj.__wbg_ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmtxbuilder_free(ptr);
    }
    /**
    */
    constructor() {
        const ret = wasm.wasmtxbuilder_new();
        this.__wbg_ptr = ret >>> 0;
        return this;
    }
    /**
    * @param {WasmScript} script
    * @param {bigint} amount
    * @returns {WasmTxBuilder}
    */
    add_recipient(script, amount) {
        _assertClass(script, WasmScript);
        var ptr0 = script.__destroy_into_raw();
        const ret = wasm.wasmtxbuilder_add_recipient(this.__wbg_ptr, ptr0, amount);
        return WasmTxBuilder.__wrap(ret);
    }
    /**
    * @param {number} index
    * @returns {WasmTxBuilder}
    */
    remove_recipient(index) {
        const ret = wasm.wasmtxbuilder_remove_recipient(this.__wbg_ptr, index);
        return WasmTxBuilder.__wrap(ret);
    }
    /**
    * @param {number} index
    * @param {WasmScript | undefined} [script]
    * @param {bigint | undefined} [amount]
    * @returns {WasmTxBuilder}
    */
    update_recipient(index, script, amount) {
        let ptr0 = 0;
        if (!isLikeNone(script)) {
            _assertClass(script, WasmScript);
            ptr0 = script.__destroy_into_raw();
        }
        const ret = wasm.wasmtxbuilder_update_recipient(this.__wbg_ptr, index, ptr0, !isLikeNone(amount), isLikeNone(amount) ? BigInt(0) : amount);
        return WasmTxBuilder.__wrap(ret);
    }
    /**
    *
    *     * UTXOs
    *
    * @param {WasmOutPoint} outpoint
    * @returns {WasmTxBuilder}
    */
    add_unspendable_utxo(outpoint) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(outpoint, WasmOutPoint);
            var ptr0 = outpoint.__destroy_into_raw();
            wasm.wasmtxbuilder_add_unspendable_utxo(retptr, this.__wbg_ptr, ptr0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return WasmTxBuilder.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {WasmOutPoint} outpoint
    * @returns {WasmTxBuilder}
    */
    remove_unspendable_utxo(outpoint) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(outpoint, WasmOutPoint);
            var ptr0 = outpoint.__destroy_into_raw();
            wasm.wasmtxbuilder_remove_unspendable_utxo(retptr, this.__wbg_ptr, ptr0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return WasmTxBuilder.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {WasmOutPoint} outpoint
    * @returns {WasmTxBuilder}
    */
    add_utxo_to_spend(outpoint) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(outpoint, WasmOutPoint);
            var ptr0 = outpoint.__destroy_into_raw();
            wasm.wasmtxbuilder_add_utxo_to_spend(retptr, this.__wbg_ptr, ptr0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return WasmTxBuilder.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {WasmOutPoint} outpoint
    * @returns {WasmTxBuilder}
    */
    remove_utxo_to_spend(outpoint) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(outpoint, WasmOutPoint);
            var ptr0 = outpoint.__destroy_into_raw();
            wasm.wasmtxbuilder_remove_utxo_to_spend(retptr, this.__wbg_ptr, ptr0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return WasmTxBuilder.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    *
    *     * Coin selection enforcement
    *
    * @returns {WasmTxBuilder}
    */
    manually_selected_only() {
        const ret = wasm.wasmtxbuilder_manually_selected_only(this.__wbg_ptr);
        return WasmTxBuilder.__wrap(ret);
    }
    /**
    *
    *     * Change policy
    *
    * @returns {WasmTxBuilder}
    */
    do_not_spend_change() {
        const ret = wasm.wasmtxbuilder_do_not_spend_change(this.__wbg_ptr);
        return WasmTxBuilder.__wrap(ret);
    }
    /**
    * @returns {WasmTxBuilder}
    */
    only_spend_change() {
        const ret = wasm.wasmtxbuilder_only_spend_change(this.__wbg_ptr);
        return WasmTxBuilder.__wrap(ret);
    }
    /**
    * @returns {WasmTxBuilder}
    */
    allow_spend_both() {
        const ret = wasm.wasmtxbuilder_allow_spend_both(this.__wbg_ptr);
        return WasmTxBuilder.__wrap(ret);
    }
    /**
    *
    *     * Fees
    *
    * @param {number} sat_per_vb
    * @returns {WasmTxBuilder}
    */
    fee_rate(sat_per_vb) {
        const ret = wasm.wasmtxbuilder_fee_rate(this.__wbg_ptr, sat_per_vb);
        return WasmTxBuilder.__wrap(ret);
    }
    /**
    * @param {bigint} fee_amount
    * @returns {WasmTxBuilder}
    */
    fee_absolute(fee_amount) {
        const ret = wasm.wasmtxbuilder_fee_absolute(this.__wbg_ptr, fee_amount);
        return WasmTxBuilder.__wrap(ret);
    }
    /**
    *
    *     * Final
    *
    * @param {WasmAccount} wasm_account
    * @returns {WasmPartiallySignedTransaction}
    */
    create_pbst(wasm_account) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(wasm_account, WasmAccount);
            wasm.wasmtxbuilder_create_pbst(retptr, this.__wbg_ptr, wasm_account.__wbg_ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return WasmPartiallySignedTransaction.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}
/**
*/
export class WasmTxIn {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmTxIn.prototype);
        obj.__wbg_ptr = ptr;

        return obj;
    }

    static __unwrap(jsValue) {
        if (!(jsValue instanceof WasmTxIn)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmtxin_free(ptr);
    }
    /**
    * @returns {WasmOutPoint}
    */
    get previous_output() {
        const ret = wasm.__wbg_get_wasmtxin_previous_output(this.__wbg_ptr);
        return WasmOutPoint.__wrap(ret);
    }
    /**
    * @param {WasmOutPoint} arg0
    */
    set previous_output(arg0) {
        _assertClass(arg0, WasmOutPoint);
        var ptr0 = arg0.__destroy_into_raw();
        wasm.__wbg_set_wasmtxin_previous_output(this.__wbg_ptr, ptr0);
    }
    /**
    * @returns {WasmScript}
    */
    get script_sig() {
        const ret = wasm.__wbg_get_wasmtxin_script_sig(this.__wbg_ptr);
        return WasmScript.__wrap(ret);
    }
    /**
    * @param {WasmScript} arg0
    */
    set script_sig(arg0) {
        _assertClass(arg0, WasmScript);
        var ptr0 = arg0.__destroy_into_raw();
        wasm.__wbg_set_wasmtxin_script_sig(this.__wbg_ptr, ptr0);
    }
    /**
    * @returns {WasmSequence}
    */
    get sequence() {
        const ret = wasm.__wbg_get_wasmtxin_sequence(this.__wbg_ptr);
        return WasmSequence.__wrap(ret);
    }
    /**
    * @param {WasmSequence} arg0
    */
    set sequence(arg0) {
        _assertClass(arg0, WasmSequence);
        var ptr0 = arg0.__destroy_into_raw();
        wasm.__wbg_set_wasmtxin_sequence(this.__wbg_ptr, ptr0);
    }
}
/**
*/
export class WasmTxOut {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmTxOut.prototype);
        obj.__wbg_ptr = ptr;

        return obj;
    }

    static __unwrap(jsValue) {
        if (!(jsValue instanceof WasmTxOut)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmtxout_free(ptr);
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
}
/**
*/
export class WasmWallet {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmwallet_free(ptr);
    }
    /**
    * @param {string} bip39_mnemonic
    * @param {string | undefined} bip38_passphrase
    * @param {WasmWalletConfig} config
    */
    constructor(bip39_mnemonic, bip38_passphrase, config) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(bip39_mnemonic, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            var ptr1 = isLikeNone(bip38_passphrase) ? 0 : passStringToWasm0(bip38_passphrase, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len1 = WASM_VECTOR_LEN;
            _assertClass(config, WasmWalletConfig);
            var ptr2 = config.__destroy_into_raw();
            wasm.wasmwallet_new(retptr, ptr0, len0, ptr1, len1, ptr2);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            this.__wbg_ptr = r0 >>> 0;
            return this;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {WasmSupportedBIPs} bip
    * @param {number} account_index
    * @returns {Promise<void>}
    */
    add_account(bip, account_index) {
        const ret = wasm.wasmwallet_add_account(this.__wbg_ptr, bip, account_index);
        return takeObject(ret);
    }
    /**
    * @returns {Promise<WasmBalance>}
    */
    get_balance() {
        const ret = wasm.wasmwallet_get_balance(this.__wbg_ptr);
        return takeObject(ret);
    }
}
/**
*/
export class WasmWalletConfig {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmwalletconfig_free(ptr);
    }
    /**
    * @returns {WasmNetwork}
    */
    get network() {
        const ret = wasm.__wbg_get_wasmwalletconfig_network(this.__wbg_ptr);
        return ret;
    }
    /**
    * @param {WasmNetwork} arg0
    */
    set network(arg0) {
        wasm.__wbg_set_wasmwalletconfig_network(this.__wbg_ptr, arg0);
    }
    /**
    * @param {WasmNetwork | undefined} [network]
    */
    constructor(network) {
        const ret = wasm.wasmwalletconfig_new(isLikeNone(network) ? 4 : network);
        this.__wbg_ptr = ret >>> 0;
        return this;
    }
}

export function __wbindgen_object_drop_ref(arg0) {
    takeObject(arg0);
};

export function __wbindgen_number_new(arg0) {
    const ret = arg0;
    return addHeapObject(ret);
};

export function __wbg_detailledwasmerror_new(arg0) {
    const ret = DetailledWasmError.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbg_wasmbalance_new(arg0) {
    const ret = WasmBalance.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbg_wasmtxin_new(arg0) {
    const ret = WasmTxIn.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbg_wasmtxout_new(arg0) {
    const ret = WasmTxOut.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbg_wasmsimpletransaction_new(arg0) {
    const ret = WasmSimpleTransaction.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbindgen_object_clone_ref(arg0) {
    const ret = getObject(arg0);
    return addHeapObject(ret);
};

export function __wbindgen_string_get(arg0, arg1) {
    const obj = getObject(arg1);
    const ret = typeof(obj) === 'string' ? obj : undefined;
    var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len1 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len1;
    getInt32Memory0()[arg0 / 4 + 0] = ptr1;
};

export function __wbg_wasmtxin_unwrap(arg0) {
    const ret = WasmTxIn.__unwrap(takeObject(arg0));
    return ret;
};

export function __wbg_wasmtxout_unwrap(arg0) {
    const ret = WasmTxOut.__unwrap(takeObject(arg0));
    return ret;
};

export function __wbindgen_string_new(arg0, arg1) {
    const ret = getStringFromWasm0(arg0, arg1);
    return addHeapObject(ret);
};

export function __wbindgen_bigint_from_u64(arg0) {
    const ret = BigInt.asUintN(64, arg0);
    return addHeapObject(ret);
};

export function __wbindgen_error_new(arg0, arg1) {
    const ret = new Error(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
};

export function __wbg_fetch_b5d6bebed1e6c2d2(arg0) {
    const ret = fetch(getObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_queueMicrotask_e5949c35d772a669(arg0) {
    queueMicrotask(getObject(arg0));
};

export function __wbg_queueMicrotask_2be8b97a81fe4d00(arg0) {
    const ret = getObject(arg0).queueMicrotask;
    return addHeapObject(ret);
};

export function __wbindgen_is_function(arg0) {
    const ret = typeof(getObject(arg0)) === 'function';
    return ret;
};

export function __wbindgen_cb_drop(arg0) {
    const obj = takeObject(arg0).original;
    if (obj.cnt-- == 1) {
        obj.a = 0;
        return true;
    }
    const ret = false;
    return ret;
};

export function __wbg_log_7811587c4c6d2844(arg0) {
    console.log(getObject(arg0));
};

export function __wbg_new_19676474aa414d62() { return handleError(function () {
    const ret = new Headers();
    return addHeapObject(ret);
}, arguments) };

export function __wbg_append_feec4143bbf21904() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).append(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
}, arguments) };

export function __wbg_signal_1ed842bebd6ae322(arg0) {
    const ret = getObject(arg0).signal;
    return addHeapObject(ret);
};

export function __wbg_new_e4960143e41697a4() { return handleError(function () {
    const ret = new AbortController();
    return addHeapObject(ret);
}, arguments) };

export function __wbg_abort_8355f201f30300bb(arg0) {
    getObject(arg0).abort();
};

export function __wbg_fetch_701fcd2bde06379a(arg0, arg1) {
    const ret = getObject(arg0).fetch(getObject(arg1));
    return addHeapObject(ret);
};

export function __wbg_instanceof_Response_944e2745b5db71f5(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof Response;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_url_1f609e63ff1a7983(arg0, arg1) {
    const ret = getObject(arg1).url;
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len1;
    getInt32Memory0()[arg0 / 4 + 0] = ptr1;
};

export function __wbg_status_7841bb47be2a8f16(arg0) {
    const ret = getObject(arg0).status;
    return ret;
};

export function __wbg_headers_ea7ef583d1564b08(arg0) {
    const ret = getObject(arg0).headers;
    return addHeapObject(ret);
};

export function __wbg_arrayBuffer_e32d72b052ba31d7() { return handleError(function (arg0) {
    const ret = getObject(arg0).arrayBuffer();
    return addHeapObject(ret);
}, arguments) };

export function __wbg_text_39a6fb98be736e16() { return handleError(function (arg0) {
    const ret = getObject(arg0).text();
    return addHeapObject(ret);
}, arguments) };

export function __wbg_newwithstrandinit_29038da14d09e330() { return handleError(function (arg0, arg1, arg2) {
    const ret = new Request(getStringFromWasm0(arg0, arg1), getObject(arg2));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_randomFillSync_a0d98aa11c81fe89() { return handleError(function (arg0, arg1) {
    getObject(arg0).randomFillSync(takeObject(arg1));
}, arguments) };

export function __wbg_getRandomValues_504510b5564925af() { return handleError(function (arg0, arg1) {
    getObject(arg0).getRandomValues(getObject(arg1));
}, arguments) };

export function __wbg_crypto_58f13aa23ffcb166(arg0) {
    const ret = getObject(arg0).crypto;
    return addHeapObject(ret);
};

export function __wbindgen_is_object(arg0) {
    const val = getObject(arg0);
    const ret = typeof(val) === 'object' && val !== null;
    return ret;
};

export function __wbg_process_5b786e71d465a513(arg0) {
    const ret = getObject(arg0).process;
    return addHeapObject(ret);
};

export function __wbg_versions_c2ab80650590b6a2(arg0) {
    const ret = getObject(arg0).versions;
    return addHeapObject(ret);
};

export function __wbg_node_523d7bd03ef69fba(arg0) {
    const ret = getObject(arg0).node;
    return addHeapObject(ret);
};

export function __wbindgen_is_string(arg0) {
    const ret = typeof(getObject(arg0)) === 'string';
    return ret;
};

export function __wbg_require_2784e593a4674877() { return handleError(function () {
    const ret = module.require;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_msCrypto_abcb1295e768d1f2(arg0) {
    const ret = getObject(arg0).msCrypto;
    return addHeapObject(ret);
};

export function __wbg_new_08236689f0afb357() {
    const ret = new Array();
    return addHeapObject(ret);
};

export function __wbg_newnoargs_ccdcae30fd002262(arg0, arg1) {
    const ret = new Function(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
};

export function __wbg_next_15da6a3df9290720(arg0) {
    const ret = getObject(arg0).next;
    return addHeapObject(ret);
};

export function __wbg_next_1989a20442400aaa() { return handleError(function (arg0) {
    const ret = getObject(arg0).next();
    return addHeapObject(ret);
}, arguments) };

export function __wbg_done_bc26bf4ada718266(arg0) {
    const ret = getObject(arg0).done;
    return ret;
};

export function __wbg_value_0570714ff7d75f35(arg0) {
    const ret = getObject(arg0).value;
    return addHeapObject(ret);
};

export function __wbg_iterator_7ee1a391d310f8e4() {
    const ret = Symbol.iterator;
    return addHeapObject(ret);
};

export function __wbg_get_2aff440840bb6202() { return handleError(function (arg0, arg1) {
    const ret = Reflect.get(getObject(arg0), getObject(arg1));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_call_669127b9d730c650() { return handleError(function (arg0, arg1) {
    const ret = getObject(arg0).call(getObject(arg1));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_new_c728d68b8b34487e() {
    const ret = new Object();
    return addHeapObject(ret);
};

export function __wbg_self_3fad056edded10bd() { return handleError(function () {
    const ret = self.self;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_window_a4f46c98a61d4089() { return handleError(function () {
    const ret = window.window;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_globalThis_17eff828815f7d84() { return handleError(function () {
    const ret = globalThis.globalThis;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_global_46f939f6541643c5() { return handleError(function () {
    const ret = global.global;
    return addHeapObject(ret);
}, arguments) };

export function __wbindgen_is_undefined(arg0) {
    const ret = getObject(arg0) === undefined;
    return ret;
};

export function __wbg_set_0ac78a2bc07da03c(arg0, arg1, arg2) {
    getObject(arg0)[arg1 >>> 0] = takeObject(arg2);
};

export function __wbg_call_53fc3abd42e24ec8() { return handleError(function (arg0, arg1, arg2) {
    const ret = getObject(arg0).call(getObject(arg1), getObject(arg2));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_new_feb65b865d980ae2(arg0, arg1) {
    try {
        var state0 = {a: arg0, b: arg1};
        var cb0 = (arg0, arg1) => {
            const a = state0.a;
            state0.a = 0;
            try {
                return __wbg_adapter_227(a, state0.b, arg0, arg1);
            } finally {
                state0.a = a;
            }
        };
        const ret = new Promise(cb0);
        return addHeapObject(ret);
    } finally {
        state0.a = state0.b = 0;
    }
};

export function __wbg_resolve_a3252b2860f0a09e(arg0) {
    const ret = Promise.resolve(getObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_then_89e1c559530b85cf(arg0, arg1) {
    const ret = getObject(arg0).then(getObject(arg1));
    return addHeapObject(ret);
};

export function __wbg_then_1bbc9edafd859b06(arg0, arg1, arg2) {
    const ret = getObject(arg0).then(getObject(arg1), getObject(arg2));
    return addHeapObject(ret);
};

export function __wbg_buffer_344d9b41efe96da7(arg0) {
    const ret = getObject(arg0).buffer;
    return addHeapObject(ret);
};

export function __wbg_newwithbyteoffsetandlength_2dc04d99088b15e3(arg0, arg1, arg2) {
    const ret = new Uint8Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_new_d8a000788389a31e(arg0) {
    const ret = new Uint8Array(getObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_set_dcfd613a3420f908(arg0, arg1, arg2) {
    getObject(arg0).set(getObject(arg1), arg2 >>> 0);
};

export function __wbg_length_a5587d6cd79ab197(arg0) {
    const ret = getObject(arg0).length;
    return ret;
};

export function __wbg_newwithlength_13b5319ab422dcf6(arg0) {
    const ret = new Uint8Array(arg0 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_subarray_6ca5cfa7fbb9abbe(arg0, arg1, arg2) {
    const ret = getObject(arg0).subarray(arg1 >>> 0, arg2 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_has_cdf8b85f6e903c80() { return handleError(function (arg0, arg1) {
    const ret = Reflect.has(getObject(arg0), getObject(arg1));
    return ret;
}, arguments) };

export function __wbg_set_40f7786a25a9cc7e() { return handleError(function (arg0, arg1, arg2) {
    const ret = Reflect.set(getObject(arg0), getObject(arg1), getObject(arg2));
    return ret;
}, arguments) };

export function __wbg_stringify_4039297315a25b00() { return handleError(function (arg0) {
    const ret = JSON.stringify(getObject(arg0));
    return addHeapObject(ret);
}, arguments) };

export function __wbindgen_debug_string(arg0, arg1) {
    const ret = debugString(getObject(arg1));
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len1;
    getInt32Memory0()[arg0 / 4 + 0] = ptr1;
};

export function __wbindgen_throw(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
};

export function __wbindgen_memory() {
    const ret = wasm.memory;
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper2016(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 260, __wbg_adapter_32);
    return addHeapObject(ret);
};


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

function isLikeNone(x) {
    return x === undefined || x === null;
}

let cachedFloat64Memory0 = null;

function getFloat64Memory0() {
    if (cachedFloat64Memory0 === null || cachedFloat64Memory0.byteLength === 0) {
        cachedFloat64Memory0 = new Float64Array(wasm.memory.buffer);
    }
    return cachedFloat64Memory0;
}

let cachedInt32Memory0 = null;

function getInt32Memory0() {
    if (cachedInt32Memory0 === null || cachedInt32Memory0.byteLength === 0) {
        cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
    }
    return cachedInt32Memory0;
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
function __wbg_adapter_44(arg0, arg1, arg2) {
    wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__hbc2e0b01eb973135(arg0, arg1, addHeapObject(arg2));
}

function __wbg_adapter_47(arg0, arg1) {
    wasm._dyn_core__ops__function__FnMut_____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h8d64563261f4f8d3(arg0, arg1);
}

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
    return instance.ptr;
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
/**
*/
export function setPanicHook() {
    wasm.setPanicHook();
}

let cachedBigInt64Memory0 = null;

function getBigInt64Memory0() {
    if (cachedBigInt64Memory0 === null || cachedBigInt64Memory0.byteLength === 0) {
        cachedBigInt64Memory0 = new BigInt64Array(wasm.memory.buffer);
    }
    return cachedBigInt64Memory0;
}

let cachedFloat32Memory0 = null;

function getFloat32Memory0() {
    if (cachedFloat32Memory0 === null || cachedFloat32Memory0.byteLength === 0) {
        cachedFloat32Memory0 = new Float32Array(wasm.memory.buffer);
    }
    return cachedFloat32Memory0;
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8Memory0().subarray(ptr / 1, ptr / 1 + len);
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8Memory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        wasm.__wbindgen_exn_store(addHeapObject(e));
    }
}
function __wbg_adapter_362(arg0, arg1, arg2, arg3) {
    wasm.wasm_bindgen__convert__closures__invoke2_mut__h6da79bd338983e5c(arg0, arg1, addHeapObject(arg2), addHeapObject(arg3));
}

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
export const WasmError = Object.freeze({ InvalidSecretKey:0,"0":"InvalidSecretKey",InvalidNetwork:1,"1":"InvalidNetwork",InvalidDescriptor:2,"2":"InvalidDescriptor",InvalidDerivationPath:3,"3":"InvalidDerivationPath",InvalidAccountIndex:4,"4":"InvalidAccountIndex",DerivationError:5,"5":"DerivationError",SyncError:6,"6":"SyncError",OutpointParsingError:7,"7":"OutpointParsingError",InvalidData:8,"8":"InvalidData",InvalidAddress:9,"9":"InvalidAddress",InvalidTxId:10,"10":"InvalidTxId",CannotComputeTxFees:11,"11":"CannotComputeTxFees",InvalidMnemonic:12,"12":"InvalidMnemonic",InvalidSeed:13,"13":"InvalidSeed",CannotGetFeeEstimation:14,"14":"CannotGetFeeEstimation",CannotSignPsbt:15,"15":"CannotSignPsbt",NoWindowContext:16,"16":"NoWindowContext",CannotGetLocalStorage:17,"17":"CannotGetLocalStorage",CannotSerializePersistedData:18,"18":"CannotSerializePersistedData",CannotPersistData:19,"19":"CannotPersistData",CannotFindPersistedData:20,"20":"CannotFindPersistedData",CannotParsePersistedData:21,"21":"CannotParsePersistedData",CannotGetAddressFromScript:22,"22":"CannotGetAddressFromScript",CannotCreateDescriptor:23,"23":"CannotCreateDescriptor",DescriptorError:24,"24":"DescriptorError",LoadError:25,"25":"LoadError",CannotCreateAddressFromScript:26,"26":"CannotCreateAddressFromScript",AccountNotFound:27,"27":"AccountNotFound",Generic:28,"28":"Generic",NoRecipients:29,"29":"NoRecipients",NoUtxosSelected:30,"30":"NoUtxosSelected",OutputBelowDustLimit:31,"31":"OutputBelowDustLimit",InsufficientFunds:32,"32":"InsufficientFunds",BnBTotalTriesExceeded:33,"33":"BnBTotalTriesExceeded",BnBNoExactMatch:34,"34":"BnBNoExactMatch",UnknownUtxo:35,"35":"UnknownUtxo",TransactionNotFound:36,"36":"TransactionNotFound",TransactionConfirmed:37,"37":"TransactionConfirmed",IrreplaceableTransaction:38,"38":"IrreplaceableTransaction",FeeRateTooLow:39,"39":"FeeRateTooLow",FeeTooLow:40,"40":"FeeTooLow",FeeRateUnavailable:41,"41":"FeeRateUnavailable",MissingKeyOrigin:42,"42":"MissingKeyOrigin",Key:43,"43":"Key",ChecksumMismatch:44,"44":"ChecksumMismatch",SpendingPolicyRequired:45,"45":"SpendingPolicyRequired",InvalidPolicyPathError:46,"46":"InvalidPolicyPathError",Signer:47,"47":"Signer",InvalidOutpoint:48,"48":"InvalidOutpoint",Descriptor:49,"49":"Descriptor",Miniscript:50,"50":"Miniscript",MiniscriptPsbt:51,"51":"MiniscriptPsbt",Bip32:52,"52":"Bip32",Bip39:53,"53":"Bip39",Psbt:54,"54":"Psbt",LockError:55,"55":"LockError", });
/**
*/
export const WasmChangeSpendPolicy = Object.freeze({ ChangeAllowed:0,"0":"ChangeAllowed",OnlyChange:1,"1":"OnlyChange",ChangeForbidden:2,"2":"ChangeForbidden", });
/**
*/
export const WasmCoinSelection = Object.freeze({ BranchAndBound:0,"0":"BranchAndBound",LargestFirst:1,"1":"LargestFirst",OldestFirst:2,"2":"OldestFirst",Manual:3,"3":"Manual", });
/**
*/
export const WasmBitcoinUnit = Object.freeze({ BTC:0,"0":"BTC",MBTC:1,"1":"MBTC",SAT:2,"2":"SAT", });
/**
*/
export const WasmSupportedBIPs = Object.freeze({ Bip44:0,"0":"Bip44",Bip49:1,"1":"Bip49",Bip84:2,"2":"Bip84",Bip86:3,"3":"Bip86", });
/**
*/
export const WasmLanguage = Object.freeze({ English:0,"0":"English",SimplifiedChinese:1,"1":"SimplifiedChinese",TraditionalChinese:2,"2":"TraditionalChinese",Czech:3,"3":"Czech",French:4,"4":"French",Italian:5,"5":"Italian",Japanese:6,"6":"Japanese",Korean:7,"7":"Korean",Spanish:8,"8":"Spanish", });
/**
*/
export const WasmPaymentLinkKind = Object.freeze({ BitcoinAddress:0,"0":"BitcoinAddress",BitcoinURI:1,"1":"BitcoinURI",LightningURI:2,"2":"LightningURI",UnifiedURI:3,"3":"UnifiedURI", });
/**
*/
export const WasmWordCount = Object.freeze({ Words12:0,"0":"Words12",Words15:1,"1":"Words15",Words18:2,"2":"Words18",Words21:3,"3":"Words21",Words24:4,"4":"Words24", });
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
export class WasmAccount {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmAccount.prototype);
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
        wasm.__wbg_wasmaccount_free(ptr);
    }
    /**
    * @returns {Promise<boolean>}
    */
    hasSyncData() {
        const ret = wasm.wasmaccount_hasSyncData(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @param {number | undefined} [index]
    * @param {bigint | undefined} [amount]
    * @param {string | undefined} [label]
    * @param {string | undefined} [message]
    * @returns {Promise<WasmPaymentLink>}
    */
    getBitcoinUri(index, amount, label, message) {
        var ptr0 = isLikeNone(label) ? 0 : passStringToWasm0(label, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        var ptr1 = isLikeNone(message) ? 0 : passStringToWasm0(message, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        const ret = wasm.wasmaccount_getBitcoinUri(this.__wbg_ptr, !isLikeNone(index), isLikeNone(index) ? 0 : index, !isLikeNone(amount), isLikeNone(amount) ? BigInt(0) : amount, ptr0, len0, ptr1, len1);
        return takeObject(ret);
    }
    /**
    * @param {WasmAddress} address
    * @returns {Promise<boolean>}
    */
    owns(address) {
        _assertClass(address, WasmAddress);
        const ret = wasm.wasmaccount_owns(this.__wbg_ptr, address.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @returns {Promise<WasmBalance>}
    */
    getBalance() {
        const ret = wasm.wasmaccount_getBalance(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @returns {Promise<string>}
    */
    getDerivationPath() {
        const ret = wasm.wasmaccount_getDerivationPath(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @returns {Promise<IWasmUtxoArray>}
    */
    getUtxos() {
        const ret = wasm.wasmaccount_getUtxos(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @param {WasmPagination | undefined} [pagination]
    * @returns {Promise<IWasmSimpleTransactionArray>}
    */
    getTransactions(pagination) {
        let ptr0 = 0;
        if (!isLikeNone(pagination)) {
            _assertClass(pagination, WasmPagination);
            ptr0 = pagination.__destroy_into_raw();
        }
        const ret = wasm.wasmaccount_getTransactions(this.__wbg_ptr, ptr0);
        return takeObject(ret);
    }
    /**
    * @param {string} txid
    * @returns {Promise<WasmDetailledTransaction>}
    */
    getTransaction(txid) {
        const ptr0 = passStringToWasm0(txid, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmaccount_getTransaction(this.__wbg_ptr, ptr0, len0);
        return takeObject(ret);
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
export class WasmAddress {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmAddress.prototype);
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
        wasm.__wbg_wasmaddress_free(ptr);
    }
    /**
    * @param {string} str
    * @param {WasmNetwork} network
    */
    constructor(str, network) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(str, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            wasm.wasmaddress_new(retptr, ptr0, len0, network);
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
    * @param {WasmScript} value
    * @param {WasmNetwork} network
    * @returns {WasmAddress}
    */
    static fromScript(value, network) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(value, WasmScript);
            var ptr0 = value.__destroy_into_raw();
            wasm.wasmaddress_fromScript(retptr, ptr0, network);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return WasmAddress.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @returns {string}
    */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.wasmaddress_toString(retptr, this.__wbg_ptr);
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
    * @returns {WasmScript}
    */
    intoScript() {
        const ret = wasm.wasmaddress_intoScript(this.__wbg_ptr);
        return WasmScript.__wrap(ret);
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
export class WasmChain {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmchain_free(ptr);
    }
    /**
    * Generates a Mnemonic with a random entropy based on the given word count.
    */
    constructor() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.wasmchain_new(retptr);
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
    * @returns {Promise<Map<string, number>>}
    */
    getFeesEstimation() {
        const ret = wasm.wasmchain_getFeesEstimation(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @param {WasmAccount} account
    * @returns {Promise<void>}
    */
    fullSync(account) {
        _assertClass(account, WasmAccount);
        const ret = wasm.wasmchain_fullSync(this.__wbg_ptr, account.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @param {WasmAccount} account
    * @returns {Promise<void>}
    */
    partialSync(account) {
        _assertClass(account, WasmAccount);
        const ret = wasm.wasmchain_partialSync(this.__wbg_ptr, account.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @param {WasmPartiallySignedTransaction} psbt
    * @returns {Promise<string>}
    */
    broadcastPsbt(psbt) {
        _assertClass(psbt, WasmPartiallySignedTransaction);
        const ret = wasm.wasmchain_broadcastPsbt(this.__wbg_ptr, psbt.__wbg_ptr);
        return takeObject(ret);
    }
}
/**
*/
export class WasmDerivationPath {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmDerivationPath.prototype);
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
    /**
    * @param {IWasmDerivationPath} raw_ts
    * @returns {WasmDerivationPath}
    */
    static fromRawTs(raw_ts) {
        const ret = wasm.wasmderivationpath_fromRawTs(addHeapObject(raw_ts));
        return WasmDerivationPath.__wrap(ret);
    }
}
/**
*/
export class WasmDetailledTransaction {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmDetailledTransaction.prototype);
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
        wasm.__wbg_wasmdetailledtransaction_free(ptr);
    }
    /**
    * @returns {string}
    */
    get txid() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.__wbg_get_wasmdetailledtransaction_txid(retptr, this.__wbg_ptr);
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
        wasm.__wbg_set_wasmdetailledtransaction_txid(this.__wbg_ptr, ptr0, len0);
    }
    /**
    * @returns {bigint}
    */
    get value() {
        const ret = wasm.__wbg_get_wasmbalance_untrusted_pending(this.__wbg_ptr);
        return ret;
    }
    /**
    * @param {bigint} arg0
    */
    set value(arg0) {
        wasm.__wbg_set_wasmbalance_untrusted_pending(this.__wbg_ptr, arg0);
    }
    /**
    * @returns {bigint | undefined}
    */
    get fees() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.__wbg_get_wasmdetailledtransaction_fees(retptr, this.__wbg_ptr);
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
        wasm.__wbg_set_wasmdetailledtransaction_fees(this.__wbg_ptr, !isLikeNone(arg0), isLikeNone(arg0) ? BigInt(0) : arg0);
    }
    /**
    * @returns {WasmTransactionTime | undefined}
    */
    get time() {
        const ret = wasm.__wbg_get_wasmdetailledtransaction_time(this.__wbg_ptr);
        return ret === 0 ? undefined : WasmTransactionTime.__wrap(ret);
    }
    /**
    * @param {WasmTransactionTime | undefined} [arg0]
    */
    set time(arg0) {
        let ptr0 = 0;
        if (!isLikeNone(arg0)) {
            _assertClass(arg0, WasmTransactionTime);
            ptr0 = arg0.__destroy_into_raw();
        }
        wasm.__wbg_set_wasmdetailledtransaction_time(this.__wbg_ptr, ptr0);
    }
    /**
    * @returns {(WasmTxIn)[]}
    */
    get inputs() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.__wbg_get_wasmdetailledtransaction_inputs(retptr, this.__wbg_ptr);
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
    set inputs(arg0) {
        const ptr0 = passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmdetailledtransaction_inputs(this.__wbg_ptr, ptr0, len0);
    }
    /**
    * @returns {(WasmTxOut)[]}
    */
    get outputs() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.__wbg_get_wasmdetailledtransaction_outputs(retptr, this.__wbg_ptr);
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
    set outputs(arg0) {
        const ptr0 = passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmdetailledtransaction_outputs(this.__wbg_ptr, ptr0, len0);
    }
    /**
    * @param {WasmPartiallySignedTransaction} psbt
    * @param {WasmAccount} account
    * @returns {Promise<WasmDetailledTransaction>}
    */
    static fromPsbt(psbt, account) {
        _assertClass(psbt, WasmPartiallySignedTransaction);
        _assertClass(account, WasmAccount);
        const ret = wasm.wasmdetailledtransaction_fromPsbt(psbt.__wbg_ptr, account.__wbg_ptr);
        return takeObject(ret);
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
    /**
    * @returns {(string)[]}
    */
    toWords() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.wasmmnemonic_toWords(retptr, this.__wbg_ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var v1 = getArrayJsValueFromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 4, 4);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}
/**
*/
export class WasmOnchainPaymentLink {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmOnchainPaymentLink.prototype);
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
        wasm.__wbg_wasmonchainpaymentlink_free(ptr);
    }
    /**
    * @returns {string | undefined}
    */
    get address() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.__wbg_get_wasmonchainpaymentlink_address(retptr, this.__wbg_ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            let v1;
            if (r0 !== 0) {
                v1 = getStringFromWasm0(r0, r1).slice();
                wasm.__wbindgen_free(r0, r1 * 1, 1);
            }
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {string | undefined} [arg0]
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
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.__wbg_get_wasmonchainpaymentlink_amount(retptr, this.__wbg_ptr);
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
    set amount(arg0) {
        wasm.__wbg_set_wasmonchainpaymentlink_amount(this.__wbg_ptr, !isLikeNone(arg0), isLikeNone(arg0) ? BigInt(0) : arg0);
    }
    /**
    * @returns {string | undefined}
    */
    get message() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.__wbg_get_wasmonchainpaymentlink_message(retptr, this.__wbg_ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            let v1;
            if (r0 !== 0) {
                v1 = getStringFromWasm0(r0, r1).slice();
                wasm.__wbindgen_free(r0, r1 * 1, 1);
            }
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {string | undefined} [arg0]
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
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.__wbg_get_wasmonchainpaymentlink_label(retptr, this.__wbg_ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            let v1;
            if (r0 !== 0) {
                v1 = getStringFromWasm0(r0, r1).slice();
                wasm.__wbindgen_free(r0, r1 * 1, 1);
            }
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {string | undefined} [arg0]
    */
    set label(arg0) {
        var ptr0 = isLikeNone(arg0) ? 0 : passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmonchainpaymentlink_label(this.__wbg_ptr, ptr0, len0);
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
    /**
    * @returns {string}
    */
    get 0() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.__wbg_get_wasmoutpoint_0(retptr, this.__wbg_ptr);
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
    set 0(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmoutpoint_0(this.__wbg_ptr, ptr0, len0);
    }
    /**
    * @param {IWasmOutpoint} raw_ts
    * @returns {WasmOutPoint}
    */
    static fromRawTs(raw_ts) {
        const ret = wasm.wasmoutpoint_fromRawTs(addHeapObject(raw_ts));
        return WasmOutPoint.__wrap(ret);
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
    /**
    * @returns {(WasmPsbtRecipient)[]}
    */
    get recipients() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.__wbg_get_wasmpartiallysignedtransaction_recipients(retptr, this.__wbg_ptr);
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
    * @param {(WasmPsbtRecipient)[]} arg0
    */
    set recipients(arg0) {
        const ptr0 = passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmpartiallysignedtransaction_recipients(this.__wbg_ptr, ptr0, len0);
    }
    /**
    * @returns {bigint}
    */
    get total_fees() {
        const ret = wasm.__wbg_get_wasmpartiallysignedtransaction_total_fees(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
    * @param {bigint} arg0
    */
    set total_fees(arg0) {
        wasm.__wbg_set_wasmpartiallysignedtransaction_total_fees(this.__wbg_ptr, arg0);
    }
    /**
    * @param {WasmAccount} wasm_account
    * @param {WasmNetwork} network
    * @returns {Promise<WasmPartiallySignedTransaction>}
    */
    sign(wasm_account, network) {
        _assertClass(wasm_account, WasmAccount);
        const ret = wasm.wasmpartiallysignedtransaction_sign(this.__wbg_ptr, wasm_account.__wbg_ptr, network);
        return takeObject(ret);
    }
}
/**
*/
export class WasmPaymentLink {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmPaymentLink.prototype);
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
        wasm.__wbg_wasmpaymentlink_free(ptr);
    }
    /**
    * @returns {string}
    */
    toString() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.wasmpaymentlink_toString(retptr, this.__wbg_ptr);
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
    * @returns {string}
    */
    toUri() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.wasmpaymentlink_toUri(retptr, this.__wbg_ptr);
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
    * @param {string} str
    * @param {WasmNetwork} network
    * @returns {WasmPaymentLink}
    */
    static tryParse(str, network) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(str, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            wasm.wasmpaymentlink_tryParse(retptr, ptr0, len0, network);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return WasmPaymentLink.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
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
/**
*/
export class WasmPsbtRecipient {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmPsbtRecipient.prototype);
        obj.__wbg_ptr = ptr;

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

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmpsbtrecipient_free(ptr);
    }
    /**
    * @returns {string}
    */
    get 0() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.__wbg_get_wasmpsbtrecipient_0(retptr, this.__wbg_ptr);
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
    set 0(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmpsbtrecipient_0(this.__wbg_ptr, ptr0, len0);
    }
    /**
    * @returns {bigint}
    */
    get 1() {
        const ret = wasm.__wbg_get_wasmpartiallysignedtransaction_total_fees(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
    * @param {bigint} arg0
    */
    set 1(arg0) {
        wasm.__wbg_set_wasmpartiallysignedtransaction_total_fees(this.__wbg_ptr, arg0);
    }
}
/**
*/
export class WasmRecipient {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmRecipient.prototype);
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
        wasm.__wbg_wasmrecipient_free(ptr);
    }
    /**
    * @returns {string}
    */
    get 0() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.__wbg_get_wasmrecipient_0(retptr, this.__wbg_ptr);
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
    set 0(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmrecipient_0(this.__wbg_ptr, ptr0, len0);
    }
    /**
    * @returns {string}
    */
    get 1() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.__wbg_get_wasmrecipient_1(retptr, this.__wbg_ptr);
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
    set 1(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmrecipient_1(this.__wbg_ptr, ptr0, len0);
    }
    /**
    * @returns {number}
    */
    get 2() {
        const ret = wasm.__wbg_get_wasmrecipient_2(this.__wbg_ptr);
        return ret;
    }
    /**
    * @param {number} arg0
    */
    set 2(arg0) {
        wasm.__wbg_set_wasmrecipient_2(this.__wbg_ptr, arg0);
    }
    /**
    * @returns {WasmBitcoinUnit}
    */
    get 3() {
        const ret = wasm.__wbg_get_wasmrecipient_3(this.__wbg_ptr);
        return ret;
    }
    /**
    * @param {WasmBitcoinUnit} arg0
    */
    set 3(arg0) {
        wasm.__wbg_set_wasmrecipient_3(this.__wbg_ptr, arg0);
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
    /**
    * @param {WasmNetwork} network
    * @returns {WasmAddress}
    */
    toAddress(network) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.wasmscript_toAddress(retptr, this.__wbg_ptr, network);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return WasmAddress.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
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
        const ret = wasm.__wbg_get_wasmbalance_untrusted_pending(this.__wbg_ptr);
        return ret;
    }
    /**
    * @param {bigint} arg0
    */
    set value(arg0) {
        wasm.__wbg_set_wasmbalance_untrusted_pending(this.__wbg_ptr, arg0);
    }
    /**
    * @returns {bigint | undefined}
    */
    get fees() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.__wbg_get_wasmdetailledtransaction_fees(retptr, this.__wbg_ptr);
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
        wasm.__wbg_set_wasmdetailledtransaction_fees(this.__wbg_ptr, !isLikeNone(arg0), isLikeNone(arg0) ? BigInt(0) : arg0);
    }
    /**
    * @returns {WasmTransactionTime}
    */
    get time() {
        const ret = wasm.__wbg_get_wasmsimpletransaction_time(this.__wbg_ptr);
        return WasmTransactionTime.__wrap(ret);
    }
    /**
    * @param {WasmTransactionTime} arg0
    */
    set time(arg0) {
        _assertClass(arg0, WasmTransactionTime);
        var ptr0 = arg0.__destroy_into_raw();
        wasm.__wbg_set_wasmsimpletransaction_time(this.__wbg_ptr, ptr0);
    }
    /**
    * @returns {WasmDerivationPath | undefined}
    */
    get account_key() {
        const ret = wasm.__wbg_get_wasmsimpletransaction_account_key(this.__wbg_ptr);
        return ret === 0 ? undefined : WasmDerivationPath.__wrap(ret);
    }
    /**
    * @param {WasmDerivationPath | undefined} [arg0]
    */
    set account_key(arg0) {
        let ptr0 = 0;
        if (!isLikeNone(arg0)) {
            _assertClass(arg0, WasmDerivationPath);
            ptr0 = arg0.__destroy_into_raw();
        }
        wasm.__wbg_set_wasmsimpletransaction_account_key(this.__wbg_ptr, ptr0);
    }
}
/**
*/
export class WasmTransactionTime {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmTransactionTime.prototype);
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
        wasm.__wbg_wasmtransactiontime_free(ptr);
    }
    /**
    * @returns {boolean}
    */
    get confirmed() {
        const ret = wasm.__wbg_get_wasmtransactiontime_confirmed(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * @param {boolean} arg0
    */
    set confirmed(arg0) {
        wasm.__wbg_set_wasmtransactiontime_confirmed(this.__wbg_ptr, arg0);
    }
    /**
    * @returns {bigint | undefined}
    */
    get confirmation_time() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.__wbg_get_wasmdetailledtransaction_fees(retptr, this.__wbg_ptr);
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
        wasm.__wbg_set_wasmdetailledtransaction_fees(this.__wbg_ptr, !isLikeNone(arg0), isLikeNone(arg0) ? BigInt(0) : arg0);
    }
    /**
    * @returns {bigint | undefined}
    */
    get last_seen() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.__wbg_get_wasmtransactiontime_last_seen(retptr, this.__wbg_ptr);
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
        wasm.__wbg_set_wasmtransactiontime_last_seen(this.__wbg_ptr, !isLikeNone(arg0), isLikeNone(arg0) ? BigInt(0) : arg0);
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
    * @param {WasmAccount} account
    * @returns {Promise<WasmTxBuilder>}
    */
    setAccount(account) {
        _assertClass(account, WasmAccount);
        const ret = wasm.wasmtxbuilder_setAccount(this.__wbg_ptr, account.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @returns {WasmTxBuilder}
    */
    clearRecipients() {
        const ret = wasm.wasmtxbuilder_clearRecipients(this.__wbg_ptr);
        return WasmTxBuilder.__wrap(ret);
    }
    /**
    * @returns {WasmTxBuilder}
    */
    addRecipient() {
        const ret = wasm.wasmtxbuilder_addRecipient(this.__wbg_ptr);
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
    * @param {string | undefined} [address_str]
    * @param {number | undefined} [amount]
    * @param {WasmBitcoinUnit | undefined} [unit]
    * @returns {Promise<WasmTxBuilder>}
    */
    updateRecipient(index, address_str, amount, unit) {
        var ptr0 = isLikeNone(address_str) ? 0 : passStringToWasm0(address_str, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmtxbuilder_updateRecipient(this.__wbg_ptr, index, ptr0, len0, !isLikeNone(amount), isLikeNone(amount) ? 0 : amount, isLikeNone(unit) ? 3 : unit);
        return takeObject(ret);
    }
    /**
    * @param {number} index
    * @returns {Promise<WasmTxBuilder>}
    */
    updateRecipientAmountToMax(index) {
        const ret = wasm.wasmtxbuilder_updateRecipientAmountToMax(this.__wbg_ptr, index);
        return takeObject(ret);
    }
    /**
    * @returns {(WasmRecipient)[]}
    */
    getRecipients() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.wasmtxbuilder_getRecipients(retptr, this.__wbg_ptr);
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
    *
    *     * UTXOs
    *
    * @param {WasmOutPoint} outpoint
    * @returns {WasmTxBuilder}
    */
    addUtxoToSpend(outpoint) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(outpoint, WasmOutPoint);
            var ptr0 = outpoint.__destroy_into_raw();
            wasm.wasmtxbuilder_addUtxoToSpend(retptr, this.__wbg_ptr, ptr0);
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
    removeUtxoToSpend(outpoint) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(outpoint, WasmOutPoint);
            var ptr0 = outpoint.__destroy_into_raw();
            wasm.wasmtxbuilder_removeUtxoToSpend(retptr, this.__wbg_ptr, ptr0);
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
    * @returns {WasmTxBuilder}
    */
    clearUtxosToSpend() {
        const ret = wasm.wasmtxbuilder_clearUtxosToSpend(this.__wbg_ptr);
        return WasmTxBuilder.__wrap(ret);
    }
    /**
    * @returns {(WasmOutPoint)[]}
    */
    getUtxosToSpend() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.wasmtxbuilder_getUtxosToSpend(retptr, this.__wbg_ptr);
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
    * @param {number} sat_per_vb
    * @returns {Promise<WasmTxBuilder>}
    */
    setFeeRate(sat_per_vb) {
        const ret = wasm.wasmtxbuilder_setFeeRate(this.__wbg_ptr, sat_per_vb);
        return takeObject(ret);
    }
    /**
    * @returns {number | undefined}
    */
    getFeeRate() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.wasmtxbuilder_getFeeRate(retptr, this.__wbg_ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getFloat32Memory0()[retptr / 4 + 1];
            return r0 === 0 ? undefined : r1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
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
    * @returns {Promise<WasmPartiallySignedTransaction>}
    */
    createPsbt(network) {
        const ret = wasm.wasmtxbuilder_createPsbt(this.__wbg_ptr, network);
        return takeObject(ret);
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
        const ret = wasm.__wbg_get_wasmbalance_immature(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
    * @param {bigint} arg0
    */
    set value(arg0) {
        wasm.__wbg_set_wasmbalance_immature(this.__wbg_ptr, arg0);
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
    * @returns {WasmAddress}
    */
    get address() {
        const ret = wasm.__wbg_get_wasmtxout_address(this.__wbg_ptr);
        return WasmAddress.__wrap(ret);
    }
    /**
    * @param {WasmAddress} arg0
    */
    set address(arg0) {
        _assertClass(arg0, WasmAddress);
        var ptr0 = arg0.__destroy_into_raw();
        wasm.__wbg_set_wasmtxout_address(this.__wbg_ptr, ptr0);
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
}
/**
*/
export class WasmUtxo {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmutxo_free(ptr);
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
    /**
    * @returns {number}
    */
    get derivation_index() {
        const ret = wasm.__wbg_get_wasmutxo_derivation_index(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
    * @param {number} arg0
    */
    set derivation_index(arg0) {
        wasm.__wbg_set_wasmutxo_derivation_index(this.__wbg_ptr, arg0);
    }
    /**
    * @returns {WasmTransactionTime}
    */
    get confirmation_time() {
        const ret = wasm.__wbg_get_wasmutxo_confirmation_time(this.__wbg_ptr);
        return WasmTransactionTime.__wrap(ret);
    }
    /**
    * @param {WasmTransactionTime} arg0
    */
    set confirmation_time(arg0) {
        _assertClass(arg0, WasmTransactionTime);
        var ptr0 = arg0.__destroy_into_raw();
        wasm.__wbg_set_wasmutxo_confirmation_time(this.__wbg_ptr, ptr0);
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
            wasm.wasmwallet_new(retptr, ptr0, len0, ptr1, len1, config.__wbg_ptr);
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
    * @returns {WasmDerivationPath}
    */
    addAccount(bip, account_index) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.wasmwallet_addAccount(retptr, this.__wbg_ptr, bip, account_index);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return WasmDerivationPath.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {WasmDerivationPath} account_key
    * @returns {WasmAccount | undefined}
    */
    getAccount(account_key) {
        _assertClass(account_key, WasmDerivationPath);
        const ret = wasm.wasmwallet_getAccount(this.__wbg_ptr, account_key.__wbg_ptr);
        return ret === 0 ? undefined : WasmAccount.__wrap(ret);
    }
    /**
    * @returns {Promise<WasmBalance>}
    */
    getBalance() {
        const ret = wasm.wasmwallet_getBalance(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @param {WasmPagination | undefined} [pagination]
    * @returns {Promise<IWasmSimpleTransactionArray>}
    */
    getTransactions(pagination) {
        let ptr0 = 0;
        if (!isLikeNone(pagination)) {
            _assertClass(pagination, WasmPagination);
            ptr0 = pagination.__destroy_into_raw();
        }
        const ret = wasm.wasmwallet_getTransactions(this.__wbg_ptr, ptr0);
        return takeObject(ret);
    }
    /**
    * @param {WasmDerivationPath} account_key
    * @param {string} txid
    * @returns {Promise<WasmDetailledTransaction>}
    */
    getTransaction(account_key, txid) {
        _assertClass(account_key, WasmDerivationPath);
        const ptr0 = passStringToWasm0(txid, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmwallet_getTransaction(this.__wbg_ptr, account_key.__wbg_ptr, ptr0, len0);
        return takeObject(ret);
    }
    /**
    * @returns {string}
    */
    getFingerprint() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.wasmwallet_getFingerprint(retptr, this.__wbg_ptr);
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
    * @returns {boolean}
    */
    get no_persist() {
        const ret = wasm.__wbg_get_wasmwalletconfig_no_persist(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
    * @param {boolean} arg0
    */
    set no_persist(arg0) {
        wasm.__wbg_set_wasmwalletconfig_no_persist(this.__wbg_ptr, arg0);
    }
    /**
    * @param {WasmNetwork | undefined} [network]
    * @param {boolean | undefined} [no_persist]
    */
    constructor(network, no_persist) {
        const ret = wasm.wasmwalletconfig_new(isLikeNone(network) ? 4 : network, isLikeNone(no_persist) ? 0xFFFFFF : no_persist ? 1 : 0);
        this.__wbg_ptr = ret >>> 0;
        return this;
    }
}

export function __wbindgen_object_drop_ref(arg0) {
    takeObject(arg0);
};

export function __wbg_detailledwasmerror_new(arg0) {
    const ret = DetailledWasmError.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbindgen_number_get(arg0, arg1) {
    const obj = getObject(arg1);
    const ret = typeof(obj) === 'number' ? obj : undefined;
    getFloat64Memory0()[arg0 / 8 + 1] = isLikeNone(ret) ? 0 : ret;
    getInt32Memory0()[arg0 / 4 + 0] = !isLikeNone(ret);
};

export function __wbindgen_object_clone_ref(arg0) {
    const ret = getObject(arg0);
    return addHeapObject(ret);
};

export function __wbg_wasmpsbtrecipient_unwrap(arg0) {
    const ret = WasmPsbtRecipient.__unwrap(takeObject(arg0));
    return ret;
};

export function __wbindgen_number_new(arg0) {
    const ret = arg0;
    return addHeapObject(ret);
};

export function __wbg_wasmoutpoint_new(arg0) {
    const ret = WasmOutPoint.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbg_wasmtxout_new(arg0) {
    const ret = WasmTxOut.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbg_wasmpartiallysignedtransaction_new(arg0) {
    const ret = WasmPartiallySignedTransaction.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbg_wasmpsbtrecipient_new(arg0) {
    const ret = WasmPsbtRecipient.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbg_wasmrecipient_new(arg0) {
    const ret = WasmRecipient.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbg_wasmtxin_new(arg0) {
    const ret = WasmTxIn.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbg_wasmpaymentlink_new(arg0) {
    const ret = WasmPaymentLink.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbg_wasmbalance_new(arg0) {
    const ret = WasmBalance.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbg_wasmdetailledtransaction_new(arg0) {
    const ret = WasmDetailledTransaction.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbg_wasmtxbuilder_new(arg0) {
    const ret = WasmTxBuilder.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbindgen_is_undefined(arg0) {
    const ret = getObject(arg0) === undefined;
    return ret;
};

export function __wbindgen_in(arg0, arg1) {
    const ret = getObject(arg0) in getObject(arg1);
    return ret;
};

export function __wbindgen_string_get(arg0, arg1) {
    const obj = getObject(arg1);
    const ret = typeof(obj) === 'string' ? obj : undefined;
    var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len1 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len1;
    getInt32Memory0()[arg0 / 4 + 0] = ptr1;
};

export function __wbindgen_is_object(arg0) {
    const val = getObject(arg0);
    const ret = typeof(val) === 'object' && val !== null;
    return ret;
};

export function __wbindgen_string_new(arg0, arg1) {
    const ret = getStringFromWasm0(arg0, arg1);
    return addHeapObject(ret);
};

export function __wbindgen_as_number(arg0) {
    const ret = +getObject(arg0);
    return ret;
};

export function __wbindgen_error_new(arg0, arg1) {
    const ret = new Error(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
};

export function __wbg_wasmtxin_unwrap(arg0) {
    const ret = WasmTxIn.__unwrap(takeObject(arg0));
    return ret;
};

export function __wbg_wasmtxout_unwrap(arg0) {
    const ret = WasmTxOut.__unwrap(takeObject(arg0));
    return ret;
};

export function __wbg_new_abda76e883ba8a5f() {
    const ret = new Error();
    return addHeapObject(ret);
};

export function __wbg_stack_658279fe44541cf6(arg0, arg1) {
    const ret = getObject(arg1).stack;
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len1;
    getInt32Memory0()[arg0 / 4 + 0] = ptr1;
};

export function __wbg_error_f851667af71bcfc6(arg0, arg1) {
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

export function __wbindgen_bigint_from_i64(arg0) {
    const ret = arg0;
    return addHeapObject(ret);
};

export function __wbindgen_bigint_from_u64(arg0) {
    const ret = BigInt.asUintN(64, arg0);
    return addHeapObject(ret);
};

export function __wbindgen_jsval_loose_eq(arg0, arg1) {
    const ret = getObject(arg0) == getObject(arg1);
    return ret;
};

export function __wbindgen_boolean_get(arg0) {
    const v = getObject(arg0);
    const ret = typeof(v) === 'boolean' ? (v ? 1 : 0) : 2;
    return ret;
};

export function __wbg_getwithrefkey_3b3c46ba20582127(arg0, arg1) {
    const ret = getObject(arg0)[getObject(arg1)];
    return addHeapObject(ret);
};

export function __wbg_set_8761474ad72b9bf1(arg0, arg1, arg2) {
    getObject(arg0)[takeObject(arg1)] = takeObject(arg2);
};

export function __wbg_fetch_b5d6bebed1e6c2d2(arg0) {
    const ret = fetch(getObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_instanceof_Window_cde2416cf5126a72(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof Window;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_localStorage_e11f72e996a4f5d9() { return handleError(function (arg0) {
    const ret = getObject(arg0).localStorage;
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
}, arguments) };

export function __wbg_getItem_c81cd3ae30cd579a() { return handleError(function (arg0, arg1, arg2, arg3) {
    const ret = getObject(arg1).getItem(getStringFromWasm0(arg2, arg3));
    var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len1 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len1;
    getInt32Memory0()[arg0 / 4 + 0] = ptr1;
}, arguments) };

export function __wbg_set_127ec8f757a854fd() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0)[getStringFromWasm0(arg1, arg2)] = getStringFromWasm0(arg3, arg4);
}, arguments) };

export function __wbg_new_19676474aa414d62() { return handleError(function () {
    const ret = new Headers();
    return addHeapObject(ret);
}, arguments) };

export function __wbg_append_feec4143bbf21904() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).append(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
}, arguments) };

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

export function __wbg_clearTimeout_76877dbc010e786d(arg0) {
    const ret = clearTimeout(takeObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_setTimeout_75cb9b6991a4031d() { return handleError(function (arg0, arg1) {
    const ret = setTimeout(getObject(arg0), arg1);
    return addHeapObject(ret);
}, arguments) };

export function __wbg_crypto_58f13aa23ffcb166(arg0) {
    const ret = getObject(arg0).crypto;
    return addHeapObject(ret);
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

export function __wbg_getRandomValues_504510b5564925af() { return handleError(function (arg0, arg1) {
    getObject(arg0).getRandomValues(getObject(arg1));
}, arguments) };

export function __wbg_randomFillSync_a0d98aa11c81fe89() { return handleError(function (arg0, arg1) {
    getObject(arg0).randomFillSync(takeObject(arg1));
}, arguments) };

export function __wbg_new_08236689f0afb357() {
    const ret = new Array();
    return addHeapObject(ret);
};

export function __wbg_newnoargs_ccdcae30fd002262(arg0, arg1) {
    const ret = new Function(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
};

export function __wbg_new_1b94180eeb48f2a2() {
    const ret = new Map();
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

export function __wbg_set_0ac78a2bc07da03c(arg0, arg1, arg2) {
    getObject(arg0)[arg1 >>> 0] = takeObject(arg2);
};

export function __wbg_instanceof_ArrayBuffer_c7cc317e5c29cc0d(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof ArrayBuffer;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_call_53fc3abd42e24ec8() { return handleError(function (arg0, arg1, arg2) {
    const ret = getObject(arg0).call(getObject(arg1), getObject(arg2));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_set_3355b9f2d3092e3b(arg0, arg1, arg2) {
    const ret = getObject(arg0).set(getObject(arg1), getObject(arg2));
    return addHeapObject(ret);
};

export function __wbg_new_feb65b865d980ae2(arg0, arg1) {
    try {
        var state0 = {a: arg0, b: arg1};
        var cb0 = (arg0, arg1) => {
            const a = state0.a;
            state0.a = 0;
            try {
                return __wbg_adapter_362(a, state0.b, arg0, arg1);
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

export function __wbg_instanceof_Uint8Array_19e6f142a5e7e1e1(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof Uint8Array;
    } catch (_) {
        result = false;
    }
    const ret = result;
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

export function __wbindgen_closure_wrapper3694(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 518, __wbg_adapter_44);
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper3705(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 523, __wbg_adapter_47);
    return addHeapObject(ret);
};


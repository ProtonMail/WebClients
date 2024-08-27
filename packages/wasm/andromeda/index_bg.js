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

const lTextDecoder = typeof TextDecoder === 'undefined' ? (0, module.require)('util').TextDecoder : TextDecoder;

let cachedTextDecoder = new lTextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

let cachedUint8Memory0 = null;

function getUint8Memory0() {
    if (cachedUint8Memory0 === null || cachedUint8Memory0.byteLength === 0) {
        cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8Memory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
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
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

let cachedInt32Memory0 = null;

function getInt32Memory0() {
    if (cachedInt32Memory0 === null || cachedInt32Memory0.byteLength === 0) {
        cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
    }
    return cachedInt32Memory0;
}

function isLikeNone(x) {
    return x === undefined || x === null;
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

const CLOSURE_DTORS = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(state => {
    wasm.__wbindgen_export_2.get(state.dtor)(state.a, state.b)
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
                wasm.__wbindgen_export_2.get(state.dtor)(a, state.b);
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
function __wbg_adapter_38(arg0, arg1, arg2) {
    wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__heac38dc5477944a3(arg0, arg1, addHeapObject(arg2));
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

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
    return instance.ptr;
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
/**
* @returns {number}
*/
export function getDefaultStopGap() {
    const ret = wasm.getDefaultStopGap();
    return ret >>> 0;
}

/**
* @param {string} word_start
* @returns {(string)[]}
*/
export function getWordsAutocomplete(word_start) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(word_start, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.getWordsAutocomplete(retptr, ptr0, len0);
        var r0 = getInt32Memory0()[retptr / 4 + 0];
        var r1 = getInt32Memory0()[retptr / 4 + 1];
        var v2 = getArrayJsValueFromWasm0(r0, r1).slice();
        wasm.__wbindgen_free(r0, r1 * 4, 4);
        return v2;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
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
/**
* @param {WasmPsbt} psbt
* @param {WasmAccount} account
* @returns {Promise<WasmTransactionDetailsData>}
*/
export function createTransactionFromPsbt(psbt, account) {
    _assertClass(psbt, WasmPsbt);
    _assertClass(account, WasmAccount);
    const ret = wasm.createTransactionFromPsbt(psbt.__wbg_ptr, account.__wbg_ptr);
    return takeObject(ret);
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        wasm.__wbindgen_exn_store(addHeapObject(e));
    }
}
function __wbg_adapter_563(arg0, arg1, arg2, arg3) {
    wasm.wasm_bindgen__convert__closures__invoke2_mut__h24dbb4e5dd65c529(arg0, arg1, addHeapObject(arg2), addHeapObject(arg3));
}

/**
*/
export const WasmScriptType = Object.freeze({ Legacy:1,"1":"Legacy",NestedSegwit:2,"2":"NestedSegwit",NativeSegwit:3,"3":"NativeSegwit",Taproot:4,"4":"Taproot", });
/**
*/
export const WasmPaymentLinkKind = Object.freeze({ BitcoinAddress:0,"0":"BitcoinAddress",BitcoinURI:1,"1":"BitcoinURI",LightningURI:2,"2":"LightningURI",UnifiedURI:3,"3":"UnifiedURI", });
/**
*/
export const WasmSortOrder = Object.freeze({ Asc:0,"0":"Asc",Desc:1,"1":"Desc", });
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
export const WasmWalletTransactionFlag = Object.freeze({ Suspicious:0,"0":"Suspicious",Private:1,"1":"Private", });
/**
*/
export const WasmLanguage = Object.freeze({ English:0,"0":"English",SimplifiedChinese:1,"1":"SimplifiedChinese",TraditionalChinese:2,"2":"TraditionalChinese",Czech:3,"3":"Czech",French:4,"4":"French",Italian:5,"5":"Italian",Japanese:6,"6":"Japanese",Korean:7,"7":"Korean",Spanish:8,"8":"Spanish", });
/**
*/
export const WasmChangeSpendPolicy = Object.freeze({ ChangeAllowed:0,"0":"ChangeAllowed",OnlyChange:1,"1":"OnlyChange",ChangeForbidden:2,"2":"ChangeForbidden", });
/**
*/
export const WasmWordCount = Object.freeze({ Words12:0,"0":"Words12",Words15:1,"1":"Words15",Words18:2,"2":"Words18",Words21:3,"3":"Words21",Words24:4,"4":"Words24", });
/**
*/
export const WasmCoinSelection = Object.freeze({ BranchAndBound:0,"0":"BranchAndBound",LargestFirst:1,"1":"LargestFirst",OldestFirst:2,"2":"OldestFirst",Manual:3,"3":"Manual", });

const WasmAccountFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmaccount_free(ptr >>> 0));
/**
*/
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
        wasm.__wbg_wasmaccount_free(ptr);
    }
    /**
    * @param {WasmWallet} wallet
    * @param {WasmScriptType} script_type
    * @param {WasmDerivationPath} derivation_path
    */
    constructor(wallet, script_type, derivation_path) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(wallet, WasmWallet);
            _assertClass(derivation_path, WasmDerivationPath);
            var ptr0 = derivation_path.__destroy_into_raw();
            wasm.wasmaccount_new(retptr, wallet.__wbg_ptr, script_type, ptr0);
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
    * @param {number} from
    * @param {number | undefined} [to]
    * @returns {Promise<void>}
    */
    markReceiveAddressesUsedTo(from, to) {
        const ret = wasm.wasmaccount_markReceiveAddressesUsedTo(this.__wbg_ptr, from, !isLikeNone(to), isLikeNone(to) ? 0 : to);
        return takeObject(ret);
    }
    /**
    * @returns {Promise<WasmAddressInfo>}
    */
    getNextReceiveAddress() {
        const ret = wasm.wasmaccount_getNextReceiveAddress(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @param {number} index
    * @returns {Promise<WasmAddressInfo>}
    */
    peekReceiveAddress(index) {
        const ret = wasm.wasmaccount_peekReceiveAddress(this.__wbg_ptr, index);
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
    * @returns {string}
    */
    getDerivationPath() {
        let deferred2_0;
        let deferred2_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.wasmaccount_getDerivationPath(retptr, this.__wbg_ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            var ptr1 = r0;
            var len1 = r1;
            if (r3) {
                ptr1 = 0; len1 = 0;
                throw takeObject(r2);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
    * @returns {Promise<WasmUtxoArray>}
    */
    getUtxos() {
        const ret = wasm.wasmaccount_getUtxos(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @param {WasmPagination | undefined} [pagination]
    * @param {WasmSortOrder | undefined} [sort]
    * @returns {Promise<WasmTransactionDetailsArray>}
    */
    getTransactions(pagination, sort) {
        const ret = wasm.wasmaccount_getTransactions(this.__wbg_ptr, isLikeNone(pagination) ? 0 : addHeapObject(pagination), isLikeNone(sort) ? 2 : sort);
        return takeObject(ret);
    }
    /**
    * @param {string} txid
    * @returns {Promise<WasmTransactionDetailsData>}
    */
    getTransaction(txid) {
        const ptr0 = passStringToWasm0(txid, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmaccount_getTransaction(this.__wbg_ptr, ptr0, len0);
        return takeObject(ret);
    }
    /**
    * @returns {Promise<boolean>}
    */
    hasSyncData() {
        const ret = wasm.wasmaccount_hasSyncData(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @param {WasmPsbt} psbt
    * @returns {Promise<void>}
    */
    insertUnconfirmedTransaction(psbt) {
        _assertClass(psbt, WasmPsbt);
        const ret = wasm.wasmaccount_insertUnconfirmedTransaction(this.__wbg_ptr, psbt.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @returns {Promise<void>}
    */
    clearStore() {
        const ret = wasm.wasmaccount_clearStore(this.__wbg_ptr);
        return takeObject(ret);
    }
}

const WasmAddressFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmaddress_free(ptr >>> 0));
/**
*/
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

const WasmAddressInfoFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmaddressinfo_free(ptr >>> 0));
/**
*/
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
        wasm.__wbg_wasmaddressinfo_free(ptr);
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
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.__wbg_get_wasmaddressinfo_address(retptr, this.__wbg_ptr);
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
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmapibitcoinaddresscreationpayloaddata_free(ptr >>> 0));
/**
*/
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
        wasm.__wbg_wasmapibitcoinaddresscreationpayloaddata_free(ptr);
    }
    /**
    * @returns {WasmApiBitcoinAddressCreationPayload}
    */
    get Data() {
        const ret = wasm.__wbg_get_wasmapibitcoinaddresscreationpayloaddata_Data(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @param {WasmApiBitcoinAddressCreationPayload} arg0
    */
    set Data(arg0) {
        wasm.__wbg_set_wasmapibitcoinaddresscreationpayloaddata_Data(this.__wbg_ptr, addHeapObject(arg0));
    }
}

const WasmApiBitcoinAddressesCreationPayloadFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmapibitcoinaddressescreationpayload_free(ptr >>> 0));
/**
*/
export class WasmApiBitcoinAddressesCreationPayload {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmApiBitcoinAddressesCreationPayloadFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmapibitcoinaddressescreationpayload_free(ptr);
    }
    /**
    * @returns {(WasmApiBitcoinAddressCreationPayloadData)[]}
    */
    get 0() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.__wbg_get_wasmapibitcoinaddressescreationpayload_0(retptr, this.__wbg_ptr);
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
    * @param {(WasmApiBitcoinAddressCreationPayloadData)[]} arg0
    */
    set 0(arg0) {
        const ptr0 = passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmapibitcoinaddressescreationpayload_0(this.__wbg_ptr, ptr0, len0);
    }
    /**
    */
    constructor() {
        const ret = wasm.wasmapibitcoinaddressescreationpayload_new();
        this.__wbg_ptr = ret >>> 0;
        return this;
    }
    /**
    * @param {WasmApiBitcoinAddressCreationPayload} create_payload
    */
    push(create_payload) {
        wasm.wasmapibitcoinaddressescreationpayload_push(this.__wbg_ptr, addHeapObject(create_payload));
    }
}

const WasmApiClientsFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmapiclients_free(ptr >>> 0));
/**
*/
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
        wasm.__wbg_wasmapiclients_free(ptr);
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
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmapiexchangeratedata_free(ptr >>> 0));
/**
*/
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
        wasm.__wbg_wasmapiexchangeratedata_free(ptr);
    }
    /**
    * @returns {WasmApiExchangeRate}
    */
    get Data() {
        const ret = wasm.__wbg_get_wasmapiexchangeratedata_Data(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @param {WasmApiExchangeRate} arg0
    */
    set Data(arg0) {
        wasm.__wbg_set_wasmapiexchangeratedata_Data(this.__wbg_ptr, addHeapObject(arg0));
    }
}

const WasmApiFiatCurrenciesFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmapifiatcurrencies_free(ptr >>> 0));
/**
*/
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
        wasm.__wbg_wasmapifiatcurrencies_free(ptr);
    }
    /**
    * @returns {(WasmApiFiatCurrencyData)[]}
    */
    get 0() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.__wbg_get_wasmapifiatcurrencies_0(retptr, this.__wbg_ptr);
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
    * @param {(WasmApiFiatCurrencyData)[]} arg0
    */
    set 0(arg0) {
        const ptr0 = passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmapifiatcurrencies_0(this.__wbg_ptr, ptr0, len0);
    }
}

const WasmApiFiatCurrencyDataFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmapifiatcurrencydata_free(ptr >>> 0));
/**
*/
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
        wasm.__wbg_wasmapifiatcurrencydata_free(ptr);
    }
    /**
    * @returns {WasmApiFiatCurrency}
    */
    get Data() {
        const ret = wasm.__wbg_get_wasmapifiatcurrencydata_Data(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @param {WasmApiFiatCurrency} arg0
    */
    set Data(arg0) {
        wasm.__wbg_set_wasmapifiatcurrencydata_Data(this.__wbg_ptr, addHeapObject(arg0));
    }
}

const WasmApiWalletAccountAddressesFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmapiwalletaccountaddresses_free(ptr >>> 0));
/**
*/
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
        wasm.__wbg_wasmapiwalletaccountaddresses_free(ptr);
    }
    /**
    * @returns {(WasmWalletAccountAddressData)[]}
    */
    get 0() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.__wbg_get_wasmapiwalletaccountaddresses_0(retptr, this.__wbg_ptr);
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
    * @param {(WasmWalletAccountAddressData)[]} arg0
    */
    set 0(arg0) {
        const ptr0 = passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmapiwalletaccountaddresses_0(this.__wbg_ptr, ptr0, len0);
    }
}

const WasmApiWalletAccountsFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmapiwalletaccounts_free(ptr >>> 0));
/**
*/
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
        wasm.__wbg_wasmapiwalletaccounts_free(ptr);
    }
    /**
    * @returns {(WasmWalletAccountData)[]}
    */
    get 0() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.__wbg_get_wasmapiwalletaccounts_0(retptr, this.__wbg_ptr);
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
    * @param {(WasmWalletAccountData)[]} arg0
    */
    set 0(arg0) {
        const ptr0 = passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmapiwalletaccounts_0(this.__wbg_ptr, ptr0, len0);
    }
}

const WasmApiWalletBitcoinAddressDataFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmapiwalletbitcoinaddressdata_free(ptr >>> 0));
/**
*/
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
        wasm.__wbg_wasmapiwalletbitcoinaddressdata_free(ptr);
    }
    /**
    * @returns {WasmApiWalletBitcoinAddress}
    */
    get Data() {
        const ret = wasm.__wbg_get_wasmapiwalletbitcoinaddressdata_Data(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @param {WasmApiWalletBitcoinAddress} arg0
    */
    set Data(arg0) {
        wasm.__wbg_set_wasmapiwalletbitcoinaddressdata_Data(this.__wbg_ptr, addHeapObject(arg0));
    }
}

const WasmApiWalletBitcoinAddressLookupDataFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmapiwalletbitcoinaddresslookupdata_free(ptr >>> 0));
/**
*/
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
        wasm.__wbg_wasmapiwalletbitcoinaddresslookupdata_free(ptr);
    }
    /**
    * @returns {WasmApiWalletBitcoinAddressLookup}
    */
    get Data() {
        const ret = wasm.__wbg_get_wasmapiwalletbitcoinaddresslookupdata_Data(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @param {WasmApiWalletBitcoinAddressLookup} arg0
    */
    set Data(arg0) {
        wasm.__wbg_set_wasmapiwalletbitcoinaddresslookupdata_Data(this.__wbg_ptr, addHeapObject(arg0));
    }
}

const WasmApiWalletBitcoinAddressesFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmapiwalletbitcoinaddresses_free(ptr >>> 0));
/**
*/
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
        wasm.__wbg_wasmapiwalletbitcoinaddresses_free(ptr);
    }
    /**
    * @returns {(WasmApiWalletBitcoinAddressData)[]}
    */
    get 0() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.__wbg_get_wasmapiwalletbitcoinaddresses_0(retptr, this.__wbg_ptr);
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
    * @param {(WasmApiWalletBitcoinAddressData)[]} arg0
    */
    set 0(arg0) {
        const ptr0 = passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmapiwalletbitcoinaddresses_0(this.__wbg_ptr, ptr0, len0);
    }
}

const WasmApiWalletDataFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmapiwalletdata_free(ptr >>> 0));
/**
*/
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
        wasm.__wbg_wasmapiwalletdata_free(ptr);
    }
    /**
    * @returns {WasmApiWallet}
    */
    get Wallet() {
        const ret = wasm.__wbg_get_wasmapiwalletdata_Wallet(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @param {WasmApiWallet} arg0
    */
    set Wallet(arg0) {
        wasm.__wbg_set_wasmapiwalletdata_Wallet(this.__wbg_ptr, addHeapObject(arg0));
    }
    /**
    * @returns {WasmApiWalletKey}
    */
    get WalletKey() {
        const ret = wasm.__wbg_get_wasmapiwalletdata_WalletKey(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @param {WasmApiWalletKey} arg0
    */
    set WalletKey(arg0) {
        wasm.__wbg_set_wasmapiwalletdata_WalletKey(this.__wbg_ptr, addHeapObject(arg0));
    }
    /**
    * @returns {WasmApiWalletSettings}
    */
    get WalletSettings() {
        const ret = wasm.__wbg_get_wasmapiwalletdata_WalletSettings(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @param {WasmApiWalletSettings} arg0
    */
    set WalletSettings(arg0) {
        wasm.__wbg_set_wasmapiwalletdata_WalletSettings(this.__wbg_ptr, addHeapObject(arg0));
    }
    /**
    * @param {WasmApiWallet} wallet
    * @param {WasmApiWalletKey} key
    * @param {WasmApiWalletSettings} settings
    * @returns {WasmApiWalletData}
    */
    static from_parts(wallet, key, settings) {
        const ret = wasm.wasmapiwalletdata_from_parts(addHeapObject(wallet), addHeapObject(key), addHeapObject(settings));
        return WasmApiWalletData.__wrap(ret);
    }
}

const WasmApiWalletTransactionDataFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmapiwallettransactiondata_free(ptr >>> 0));
/**
*/
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
        wasm.__wbg_wasmapiwallettransactiondata_free(ptr);
    }
    /**
    * @returns {WasmApiWalletTransaction}
    */
    get Data() {
        const ret = wasm.__wbg_get_wasmapiwallettransactiondata_Data(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @param {WasmApiWalletTransaction} arg0
    */
    set Data(arg0) {
        wasm.__wbg_set_wasmapiwallettransactiondata_Data(this.__wbg_ptr, addHeapObject(arg0));
    }
}

const WasmApiWalletTransactionsFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmapiwallettransactions_free(ptr >>> 0));
/**
*/
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
        wasm.__wbg_wasmapiwallettransactions_free(ptr);
    }
    /**
    * @returns {(WasmApiWalletTransactionData)[]}
    */
    get 0() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.__wbg_get_wasmapiwallettransactions_0(retptr, this.__wbg_ptr);
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
    * @param {(WasmApiWalletTransactionData)[]} arg0
    */
    set 0(arg0) {
        const ptr0 = passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmapiwallettransactions_0(this.__wbg_ptr, ptr0, len0);
    }
}

const WasmApiWalletsDataFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmapiwalletsdata_free(ptr >>> 0));
/**
*/
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
        wasm.__wbg_wasmapiwalletsdata_free(ptr);
    }
    /**
    * @returns {(WasmApiWalletData)[]}
    */
    get 0() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.__wbg_get_wasmapiwalletsdata_0(retptr, this.__wbg_ptr);
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
    * @param {(WasmApiWalletData)[]} arg0
    */
    set 0(arg0) {
        const ptr0 = passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmapiwalletsdata_0(this.__wbg_ptr, ptr0, len0);
    }
}

const WasmAuthDataFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmauthdata_free(ptr >>> 0));
/**
*/
export class WasmAuthData {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmAuthDataFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmauthdata_free(ptr);
    }
    /**
    * @returns {string}
    */
    get uid() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.__wbg_get_wasmaddressinfo_address(retptr, this.__wbg_ptr);
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
    set uid(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmaddressinfo_address(this.__wbg_ptr, ptr0, len0);
    }
    /**
    * @returns {string}
    */
    get access() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.__wbg_get_wasmauthdata_access(retptr, this.__wbg_ptr);
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
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.__wbg_get_wasmauthdata_refresh(retptr, this.__wbg_ptr);
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
    set refresh(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmauthdata_refresh(this.__wbg_ptr, ptr0, len0);
    }
    /**
    * @returns {(string)[]}
    */
    get scopes() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.__wbg_get_wasmauthdata_scopes(retptr, this.__wbg_ptr);
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
    * @param {(string)[]} arg0
    */
    set scopes(arg0) {
        const ptr0 = passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmauthdata_scopes(this.__wbg_ptr, ptr0, len0);
    }
}

const WasmBalanceFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmbalance_free(ptr >>> 0));
/**
*/
export class WasmBalance {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmBalance.prototype);
        obj.__wbg_ptr = ptr;
        WasmBalanceFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmBalanceFinalization.unregister(this);
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

const WasmBitcoinAddressClientFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmbitcoinaddressclient_free(ptr >>> 0));
/**
*/
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
        wasm.__wbg_wasmbitcoinaddressclient_free(ptr);
    }
    /**
    * @param {string} wallet_id
    * @param {string} wallet_account_id
    * @param {number | undefined} [only_without_bitcoin_addresses]
    * @returns {Promise<WasmApiWalletBitcoinAddresses>}
    */
    getBitcoinAddresses(wallet_id, wallet_account_id, only_without_bitcoin_addresses) {
        const ptr0 = passStringToWasm0(wallet_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(wallet_account_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.wasmbitcoinaddressclient_getBitcoinAddresses(this.__wbg_ptr, ptr0, len0, ptr1, len1, isLikeNone(only_without_bitcoin_addresses) ? 0xFFFFFF : only_without_bitcoin_addresses);
        return takeObject(ret);
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
        return takeObject(ret);
    }
    /**
    * @param {string} wallet_id
    * @param {string} wallet_account_id
    * @param {WasmApiBitcoinAddressesCreationPayload} bitcoin_addresses
    * @returns {Promise<WasmApiWalletBitcoinAddresses>}
    */
    addBitcoinAddress(wallet_id, wallet_account_id, bitcoin_addresses) {
        const ptr0 = passStringToWasm0(wallet_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(wallet_account_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        _assertClass(bitcoin_addresses, WasmApiBitcoinAddressesCreationPayload);
        var ptr2 = bitcoin_addresses.__destroy_into_raw();
        const ret = wasm.wasmbitcoinaddressclient_addBitcoinAddress(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2);
        return takeObject(ret);
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
        const ret = wasm.wasmbitcoinaddressclient_updateBitcoinAddress(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2, addHeapObject(bitcoin_address));
        return takeObject(ret);
    }
}

const WasmBlockchainClientFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmblockchainclient_free(ptr >>> 0));
/**
*/
export class WasmBlockchainClient {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmBlockchainClientFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmblockchainclient_free(ptr);
    }
    /**
    * Generates a Mnemonic with a random entropy based on the given word
    * count.
    * @param {WasmProtonWalletApiClient} proton_api_client
    */
    constructor(proton_api_client) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(proton_api_client, WasmProtonWalletApiClient);
            wasm.wasmblockchainclient_new(retptr, proton_api_client.__wbg_ptr);
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
        const ret = wasm.wasmblockchainclient_getFeesEstimation(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @param {WasmAccount} account
    * @param {number | undefined} [stop_gap]
    * @returns {Promise<void>}
    */
    fullSync(account, stop_gap) {
        _assertClass(account, WasmAccount);
        const ret = wasm.wasmblockchainclient_fullSync(this.__wbg_ptr, account.__wbg_ptr, !isLikeNone(stop_gap), isLikeNone(stop_gap) ? 0 : stop_gap);
        return takeObject(ret);
    }
    /**
    * @param {WasmAccount} account
    * @returns {Promise<void>}
    */
    partialSync(account) {
        _assertClass(account, WasmAccount);
        const ret = wasm.wasmblockchainclient_partialSync(this.__wbg_ptr, account.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @param {WasmAccount} account
    * @returns {Promise<boolean>}
    */
    shouldSync(account) {
        _assertClass(account, WasmAccount);
        const ret = wasm.wasmblockchainclient_shouldSync(this.__wbg_ptr, account.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @param {WasmPsbt} psbt
    * @param {string} wallet_id
    * @param {string} wallet_account_id
    * @param {WasmTransactionData} transaction_data
    * @param {WasmEmailIntegrationData | undefined} [email_integration]
    * @returns {Promise<string>}
    */
    broadcastPsbt(psbt, wallet_id, wallet_account_id, transaction_data, email_integration) {
        _assertClass(psbt, WasmPsbt);
        const ptr0 = passStringToWasm0(wallet_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(wallet_account_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.wasmblockchainclient_broadcastPsbt(this.__wbg_ptr, psbt.__wbg_ptr, ptr0, len0, ptr1, len1, addHeapObject(transaction_data), isLikeNone(email_integration) ? 0 : addHeapObject(email_integration));
        return takeObject(ret);
    }
}

const WasmCountriesAndProviderTuppleFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmcountriesandprovidertupple_free(ptr >>> 0));
/**
*/
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
        wasm.__wbg_wasmcountriesandprovidertupple_free(ptr);
    }
    /**
    * @returns {WasmGatewayProvider}
    */
    get 0() {
        const ret = wasm.__wbg_get_wasmcountriesandprovidertupple_0(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @param {WasmGatewayProvider} arg0
    */
    set 0(arg0) {
        wasm.__wbg_set_wasmcountriesandprovidertupple_0(this.__wbg_ptr, addHeapObject(arg0));
    }
    /**
    * @returns {WasmCountries}
    */
    get 1() {
        const ret = wasm.__wbg_get_wasmcountriesandprovidertupple_1(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @param {WasmCountries} arg0
    */
    set 1(arg0) {
        wasm.__wbg_set_wasmcountriesandprovidertupple_1(this.__wbg_ptr, addHeapObject(arg0));
    }
}

const WasmCountriesByProviderFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmcountriesbyprovider_free(ptr >>> 0));
/**
*/
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
        wasm.__wbg_wasmcountriesbyprovider_free(ptr);
    }
    /**
    * @returns {(WasmCountriesAndProviderTupple)[]}
    */
    get data() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.__wbg_get_wasmcountriesbyprovider_data(retptr, this.__wbg_ptr);
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
    * @param {(WasmCountriesAndProviderTupple)[]} arg0
    */
    set data(arg0) {
        const ptr0 = passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmcountriesbyprovider_data(this.__wbg_ptr, ptr0, len0);
    }
}

const WasmDerivationPathFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmderivationpath_free(ptr >>> 0));
/**
*/
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
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(str, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            wasm.wasmderivationpath_fromString(retptr, ptr0, len0);
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
}

const WasmDetailledTxInFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmdetailledtxin_free(ptr >>> 0));
/**
*/
export class WasmDetailledTxIn {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmDetailledTxInFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmdetailledtxin_free(ptr);
    }
    /**
    * @returns {WasmTxOut | undefined}
    */
    get previous_output() {
        const ret = wasm.__wbg_get_wasmdetailledtxin_previous_output(this.__wbg_ptr);
        return ret === 0 ? undefined : WasmTxOut.__wrap(ret);
    }
    /**
    * @param {WasmTxOut | undefined} [arg0]
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
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmdiscoveredaccount_free(ptr >>> 0));
/**
*/
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
        wasm.__wbg_wasmdiscoveredaccount_free(ptr);
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
        const ret = wasm.__wbg_get_wasmaddressinfo_index(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
    * @param {number} arg0
    */
    set 1(arg0) {
        wasm.__wbg_set_wasmaddressinfo_index(this.__wbg_ptr, arg0);
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
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmdiscoveredaccounts_free(ptr >>> 0));
/**
*/
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
        wasm.__wbg_wasmdiscoveredaccounts_free(ptr);
    }
    /**
    * @returns {(WasmDiscoveredAccount)[]}
    */
    get data() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.__wbg_get_wasmdiscoveredaccounts_data(retptr, this.__wbg_ptr);
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
    * @param {(WasmDiscoveredAccount)[]} arg0
    */
    set data(arg0) {
        const ptr0 = passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmdiscoveredaccounts_data(this.__wbg_ptr, ptr0, len0);
    }
}

const WasmEmailIntegrationClientFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmemailintegrationclient_free(ptr >>> 0));
/**
*/
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
        wasm.__wbg_wasmemailintegrationclient_free(ptr);
    }
    /**
    * @param {string} email
    * @returns {Promise<WasmApiWalletBitcoinAddressLookupData>}
    */
    lookupBitcoinAddress(email) {
        const ptr0 = passStringToWasm0(email, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmemailintegrationclient_lookupBitcoinAddress(this.__wbg_ptr, ptr0, len0);
        return takeObject(ret);
    }
    /**
    * @param {string} email
    * @returns {Promise<void>}
    */
    createBitcoinAddressesRequest(email) {
        const ptr0 = passStringToWasm0(email, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmemailintegrationclient_createBitcoinAddressesRequest(this.__wbg_ptr, ptr0, len0);
        return takeObject(ret);
    }
}

const WasmExchangeRateClientFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmexchangerateclient_free(ptr >>> 0));
/**
*/
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
        wasm.__wbg_wasmexchangerateclient_free(ptr);
    }
    /**
    * @param {WasmFiatCurrencySymbol} fiat
    * @param {bigint | undefined} [time]
    * @returns {Promise<WasmApiExchangeRateData>}
    */
    getExchangeRate(fiat, time) {
        const ret = wasm.wasmexchangerateclient_getExchangeRate(this.__wbg_ptr, addHeapObject(fiat), !isLikeNone(time), isLikeNone(time) ? BigInt(0) : time);
        return takeObject(ret);
    }
    /**
    * @returns {Promise<WasmApiFiatCurrencies>}
    */
    getAllFiatCurrencies() {
        const ret = wasm.wasmexchangerateclient_getAllFiatCurrencies(this.__wbg_ptr);
        return takeObject(ret);
    }
}

const WasmFiatCurrenciesAndProviderTuppleFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmfiatcurrenciesandprovidertupple_free(ptr >>> 0));
/**
*/
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
        wasm.__wbg_wasmfiatcurrenciesandprovidertupple_free(ptr);
    }
    /**
    * @returns {WasmGatewayProvider}
    */
    get 0() {
        const ret = wasm.__wbg_get_wasmcountriesandprovidertupple_0(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @param {WasmGatewayProvider} arg0
    */
    set 0(arg0) {
        wasm.__wbg_set_wasmcountriesandprovidertupple_0(this.__wbg_ptr, addHeapObject(arg0));
    }
    /**
    * @returns {WasmFiatCurrencies}
    */
    get 1() {
        const ret = wasm.__wbg_get_wasmfiatcurrenciesandprovidertupple_1(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @param {WasmFiatCurrencies} arg0
    */
    set 1(arg0) {
        wasm.__wbg_set_wasmfiatcurrenciesandprovidertupple_1(this.__wbg_ptr, addHeapObject(arg0));
    }
}

const WasmFiatCurrenciesByProviderFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmfiatcurrenciesbyprovider_free(ptr >>> 0));
/**
*/
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
        wasm.__wbg_wasmfiatcurrenciesbyprovider_free(ptr);
    }
    /**
    * @returns {(WasmFiatCurrenciesAndProviderTupple)[]}
    */
    get data() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.__wbg_get_wasmfiatcurrenciesbyprovider_data(retptr, this.__wbg_ptr);
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
    * @param {(WasmFiatCurrenciesAndProviderTupple)[]} arg0
    */
    set data(arg0) {
        const ptr0 = passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmfiatcurrenciesbyprovider_data(this.__wbg_ptr, ptr0, len0);
    }
}

const WasmInviteClientFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasminviteclient_free(ptr >>> 0));
/**
*/
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
        wasm.__wbg_wasminviteclient_free(ptr);
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
        return takeObject(ret);
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
        const ret = wasm.wasminviteclient_checkInviteStatus(this.__wbg_ptr, ptr0, len0, addHeapObject(invite_notification_type), ptr1, len1);
        return takeObject(ret);
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
        return takeObject(ret);
    }
    /**
    * @returns {Promise<WasmRemainingMonthlyInvitations>}
    */
    getRemainingMonthlyInvitation() {
        const ret = wasm.wasminviteclient_getRemainingMonthlyInvitation(this.__wbg_ptr);
        return takeObject(ret);
    }
}

const WasmLockTimeFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmlocktime_free(ptr >>> 0));
/**
*/
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

const WasmMnemonicFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmmnemonic_free(ptr >>> 0));
/**
*/
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
        wasm.__wbg_wasmmnemonic_free(ptr);
    }
    /**
    * Generates a Mnemonic with a random entropy based on the given word
    * count.
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
    asWords() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.wasmmnemonic_asWords(retptr, this.__wbg_ptr);
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

const WasmNetworkClientFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmnetworkclient_free(ptr >>> 0));
/**
*/
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
        wasm.__wbg_wasmnetworkclient_free(ptr);
    }
    /**
    * @returns {Promise<WasmNetwork>}
    */
    getNetwork() {
        const ret = wasm.wasmnetworkclient_getNetwork(this.__wbg_ptr);
        return takeObject(ret);
    }
}

const WasmOnchainPaymentLinkFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmonchainpaymentlink_free(ptr >>> 0));
/**
*/
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

const WasmOutPointFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmoutpoint_free(ptr >>> 0));
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

const WasmPaymentGatewayClientFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmpaymentgatewayclient_free(ptr >>> 0));
/**
*/
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
        wasm.__wbg_wasmpaymentgatewayclient_free(ptr);
    }
    /**
    * @returns {Promise<WasmCountriesByProvider>}
    */
    getCountries() {
        const ret = wasm.wasmpaymentgatewayclient_getCountries(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @returns {Promise<WasmFiatCurrenciesByProvider>}
    */
    getFiatCurrencies() {
        const ret = wasm.wasmpaymentgatewayclient_getFiatCurrencies(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @param {string} fiat_currency
    * @returns {Promise<WasmPaymentMethodsByProvider>}
    */
    getPaymentMethods(fiat_currency) {
        const ptr0 = passStringToWasm0(fiat_currency, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmpaymentgatewayclient_getPaymentMethods(this.__wbg_ptr, ptr0, len0);
        return takeObject(ret);
    }
    /**
    * @param {number} amount
    * @param {string} fiat_currency
    * @param {WasmPaymentMethod | undefined} [payment_method]
    * @param {WasmGatewayProvider | undefined} [provider]
    * @returns {Promise<WasmQuotesByProvider>}
    */
    getQuotes(amount, fiat_currency, payment_method, provider) {
        const ptr0 = passStringToWasm0(fiat_currency, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmpaymentgatewayclient_getQuotes(this.__wbg_ptr, amount, ptr0, len0, isLikeNone(payment_method) ? 0 : addHeapObject(payment_method), isLikeNone(provider) ? 0 : addHeapObject(provider));
        return takeObject(ret);
    }
    /**
    * @param {string} amount
    * @param {string} btc_address
    * @param {string} fiat_currency
    * @param {WasmPaymentMethod} payment_method
    * @param {WasmGatewayProvider} provider
    * @returns {Promise<string>}
    */
    createOnRampCheckout(amount, btc_address, fiat_currency, payment_method, provider) {
        const ptr0 = passStringToWasm0(amount, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(btc_address, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(fiat_currency, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ret = wasm.wasmpaymentgatewayclient_createOnRampCheckout(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2, addHeapObject(payment_method), addHeapObject(provider));
        return takeObject(ret);
    }
    /**
    * @param {string} url
    * @param {WasmGatewayProvider} provider
    * @returns {Promise<string>}
    */
    signUrl(url, provider) {
        const ptr0 = passStringToWasm0(url, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmpaymentgatewayclient_signUrl(this.__wbg_ptr, ptr0, len0, addHeapObject(provider));
        return takeObject(ret);
    }
    /**
    * @param {WasmGatewayProvider} provider
    * @returns {Promise<string>}
    */
    getPublicApiKey(provider) {
        const ret = wasm.wasmpaymentgatewayclient_getPublicApiKey(this.__wbg_ptr, addHeapObject(provider));
        return takeObject(ret);
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
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(address, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passStringToWasm0(fiat_currency, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            wasm.wasmpaymentgatewayclient_getCheckoutIframeSrc(retptr, this.__wbg_ptr, amount, ptr0, len0, ptr1, len1, addHeapObject(payment_method), addHeapObject(provider));
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            deferred3_0 = r0;
            deferred3_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
        }
    }
}

const WasmPaymentLinkFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmpaymentlink_free(ptr >>> 0));
/**
*/
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

const WasmPaymentMethodsAndProviderTuppleFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmpaymentmethodsandprovidertupple_free(ptr >>> 0));
/**
*/
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
        wasm.__wbg_wasmpaymentmethodsandprovidertupple_free(ptr);
    }
    /**
    * @returns {WasmGatewayProvider}
    */
    get 0() {
        const ret = wasm.__wbg_get_wasmcountriesandprovidertupple_0(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @param {WasmGatewayProvider} arg0
    */
    set 0(arg0) {
        wasm.__wbg_set_wasmcountriesandprovidertupple_0(this.__wbg_ptr, addHeapObject(arg0));
    }
    /**
    * @returns {WasmPaymentMethods}
    */
    get 1() {
        const ret = wasm.__wbg_get_wasmpaymentmethodsandprovidertupple_1(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @param {WasmPaymentMethods} arg0
    */
    set 1(arg0) {
        wasm.__wbg_set_wasmpaymentmethodsandprovidertupple_1(this.__wbg_ptr, addHeapObject(arg0));
    }
}

const WasmPaymentMethodsByProviderFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmpaymentmethodsbyprovider_free(ptr >>> 0));
/**
*/
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
        wasm.__wbg_wasmpaymentmethodsbyprovider_free(ptr);
    }
    /**
    * @returns {(WasmPaymentMethodsAndProviderTupple)[]}
    */
    get data() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.__wbg_get_wasmpaymentmethodsbyprovider_data(retptr, this.__wbg_ptr);
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
    * @param {(WasmPaymentMethodsAndProviderTupple)[]} arg0
    */
    set data(arg0) {
        const ptr0 = passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmpaymentmethodsbyprovider_data(this.__wbg_ptr, ptr0, len0);
    }
}

const WasmPriceGraphClientFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmpricegraphclient_free(ptr >>> 0));
/**
*/
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
        wasm.__wbg_wasmpricegraphclient_free(ptr);
    }
    /**
    * @param {WasmFiatCurrencySymbol} fiat_currency
    * @param {WasmTimeframe} timeframe
    * @returns {Promise<WasmWrappedPriceGraph>}
    */
    getGraphData(fiat_currency, timeframe) {
        const ret = wasm.wasmpricegraphclient_getGraphData(this.__wbg_ptr, addHeapObject(fiat_currency), addHeapObject(timeframe));
        return takeObject(ret);
    }
}

const WasmProtonWalletApiClientFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmprotonwalletapiclient_free(ptr >>> 0));
/**
*/
export class WasmProtonWalletApiClient {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmProtonWalletApiClientFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmprotonwalletapiclient_free(ptr);
    }
    /**
    * @param {string} app_version
    * @param {string} user_agent
    * @param {string | undefined} [uid_str]
    * @param {string | undefined} [origin]
    * @param {string | undefined} [url_prefix]
    */
    constructor(app_version, user_agent, uid_str, origin, url_prefix) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
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
            wasm.wasmprotonwalletapiclient_new(retptr, ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4);
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
    * @returns {WasmApiClients}
    */
    clients() {
        const ret = wasm.wasmprotonwalletapiclient_clients(this.__wbg_ptr);
        return WasmApiClients.__wrap(ret);
    }
}

const WasmPsbtFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmpsbt_free(ptr >>> 0));
/**
*/
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
        wasm.__wbg_wasmpsbt_free(ptr);
    }
    /**
    * @returns {(WasmPsbtRecipient)[]}
    */
    get recipients() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.__wbg_get_wasmpsbt_recipients(retptr, this.__wbg_ptr);
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
    * @param {WasmAccount} wasm_account
    * @param {WasmNetwork} network
    * @returns {Promise<WasmPsbt>}
    */
    sign(wasm_account, network) {
        _assertClass(wasm_account, WasmAccount);
        const ret = wasm.wasmpsbt_sign(this.__wbg_ptr, wasm_account.__wbg_ptr, network);
        return takeObject(ret);
    }
    /**
    * @returns {number}
    */
    computeTxSize() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.wasmpsbt_computeTxSize(retptr, this.__wbg_ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return r0 >>> 0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}

const WasmPsbtAndTxBuilderFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmpsbtandtxbuilder_free(ptr >>> 0));
/**
*/
export class WasmPsbtAndTxBuilder {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmPsbtAndTxBuilderFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmpsbtandtxbuilder_free(ptr);
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
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmpsbtrecipient_free(ptr >>> 0));
/**
*/
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
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmquotesandprovidertupple_free(ptr >>> 0));
/**
*/
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
        wasm.__wbg_wasmquotesandprovidertupple_free(ptr);
    }
    /**
    * @returns {WasmGatewayProvider}
    */
    get 0() {
        const ret = wasm.__wbg_get_wasmcountriesandprovidertupple_0(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @param {WasmGatewayProvider} arg0
    */
    set 0(arg0) {
        wasm.__wbg_set_wasmcountriesandprovidertupple_0(this.__wbg_ptr, addHeapObject(arg0));
    }
    /**
    * @returns {WasmQuotes}
    */
    get 1() {
        const ret = wasm.__wbg_get_wasmquotesandprovidertupple_1(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @param {WasmQuotes} arg0
    */
    set 1(arg0) {
        wasm.__wbg_set_wasmquotesandprovidertupple_1(this.__wbg_ptr, addHeapObject(arg0));
    }
}

const WasmQuotesByProviderFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmquotesbyprovider_free(ptr >>> 0));
/**
*/
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
        wasm.__wbg_wasmquotesbyprovider_free(ptr);
    }
    /**
    * @returns {(WasmQuotesAndProviderTupple)[]}
    */
    get data() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.__wbg_get_wasmquotesbyprovider_data(retptr, this.__wbg_ptr);
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
    * @param {(WasmQuotesAndProviderTupple)[]} arg0
    */
    set data(arg0) {
        const ptr0 = passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmquotesbyprovider_data(this.__wbg_ptr, ptr0, len0);
    }
}

const WasmRecipientFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmrecipient_free(ptr >>> 0));
/**
*/
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
            wasm.__wbg_get_wasmauthdata_access(retptr, this.__wbg_ptr);
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
            wasm.__wbg_get_wasmauthdata_refresh(retptr, this.__wbg_ptr);
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
        wasm.__wbg_set_wasmauthdata_refresh(this.__wbg_ptr, ptr0, len0);
    }
    /**
    * @returns {bigint}
    */
    get 2() {
        const ret = wasm.__wbg_get_wasmrecipient_2(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
    * @param {bigint} arg0
    */
    set 2(arg0) {
        wasm.__wbg_set_wasmrecipient_2(this.__wbg_ptr, arg0);
    }
}

const WasmRemainingMonthlyInvitationsFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmremainingmonthlyinvitations_free(ptr >>> 0));
/**
*/
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
        wasm.__wbg_wasmremainingmonthlyinvitations_free(ptr);
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
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmscript_free(ptr >>> 0));
/**
*/
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
        wasm.__wbg_set_wasmoutpoint_0(this.__wbg_ptr, ptr0, len0);
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

const WasmSequenceFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmsequence_free(ptr >>> 0));
/**
*/
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

const WasmSettingsClientFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmsettingsclient_free(ptr >>> 0));
/**
*/
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
        wasm.__wbg_wasmsettingsclient_free(ptr);
    }
    /**
    * @returns {Promise<WasmUserSettingsData>}
    */
    getUserSettings() {
        const ret = wasm.wasmsettingsclient_getUserSettings(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @param {WasmBitcoinUnit} symbol
    * @returns {Promise<WasmUserSettingsData>}
    */
    setBitcoinUnit(symbol) {
        const ret = wasm.wasmsettingsclient_setBitcoinUnit(this.__wbg_ptr, addHeapObject(symbol));
        return takeObject(ret);
    }
    /**
    * @param {WasmFiatCurrencySymbol} symbol
    * @returns {Promise<WasmUserSettingsData>}
    */
    setFiatCurrency(symbol) {
        const ret = wasm.wasmsettingsclient_setFiatCurrency(this.__wbg_ptr, addHeapObject(symbol));
        return takeObject(ret);
    }
    /**
    * @param {bigint} amount
    * @returns {Promise<WasmUserSettingsData>}
    */
    setTwoFaThreshold(amount) {
        const ret = wasm.wasmsettingsclient_setTwoFaThreshold(this.__wbg_ptr, amount);
        return takeObject(ret);
    }
    /**
    * @param {boolean} hide_empty_used_addresses
    * @returns {Promise<WasmUserSettingsData>}
    */
    setHideEmptyUsedAddresses(hide_empty_used_addresses) {
        const ret = wasm.wasmsettingsclient_setHideEmptyUsedAddresses(this.__wbg_ptr, hide_empty_used_addresses);
        return takeObject(ret);
    }
    /**
    * @param {WasmUserReceiveNotificationEmailTypes} email_type
    * @param {boolean} is_enable
    * @returns {Promise<WasmUserSettingsData>}
    */
    setReceiveNotificationEmail(email_type, is_enable) {
        const ret = wasm.wasmsettingsclient_setReceiveNotificationEmail(this.__wbg_ptr, addHeapObject(email_type), is_enable);
        return takeObject(ret);
    }
    /**
    * @returns {Promise<WasmUserSettingsData>}
    */
    acceptTermsAndConditions() {
        const ret = wasm.wasmsettingsclient_acceptTermsAndConditions(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @returns {Promise<number>}
    */
    getUserWalletEligibility() {
        const ret = wasm.wasmsettingsclient_getUserWalletEligibility(this.__wbg_ptr);
        return takeObject(ret);
    }
}

const WasmTransactionFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmtransaction_free(ptr >>> 0));
/**
*/
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
        wasm.__wbg_wasmtransaction_free(ptr);
    }
    /**
    * @param {WasmPsbt} value
    * @returns {WasmTransaction}
    */
    static fromPsbt(value) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            _assertClass(value, WasmPsbt);
            var ptr0 = value.__destroy_into_raw();
            wasm.wasmtransaction_fromPsbt(retptr, ptr0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return WasmTransaction.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}

const WasmTransactionDetailsArrayFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmtransactiondetailsarray_free(ptr >>> 0));
/**
*/
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
        wasm.__wbg_wasmtransactiondetailsarray_free(ptr);
    }
    /**
    * @returns {(WasmTransactionDetailsData)[]}
    */
    get 0() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.__wbg_get_wasmtransactiondetailsarray_0(retptr, this.__wbg_ptr);
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
    * @param {(WasmTransactionDetailsData)[]} arg0
    */
    set 0(arg0) {
        const ptr0 = passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmtransactiondetailsarray_0(this.__wbg_ptr, ptr0, len0);
    }
}

const WasmTransactionDetailsDataFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmtransactiondetailsdata_free(ptr >>> 0));
/**
*/
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
        wasm.__wbg_wasmtransactiondetailsdata_free(ptr);
    }
    /**
    * @returns {WasmTransactionDetails}
    */
    get Data() {
        const ret = wasm.__wbg_get_wasmtransactiondetailsdata_Data(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @param {WasmTransactionDetails} arg0
    */
    set Data(arg0) {
        wasm.__wbg_set_wasmtransactiondetailsdata_Data(this.__wbg_ptr, addHeapObject(arg0));
    }
}

const WasmTxBuilderFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmtxbuilder_free(ptr >>> 0));
/**
*/
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
    * @param {string | undefined} [address_str]
    * @param {bigint | undefined} [amount]
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
    * @param {string | undefined} [address_str]
    * @param {bigint | undefined} [amount]
    * @returns {WasmTxBuilder}
    */
    updateRecipient(index, address_str, amount) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            var ptr0 = isLikeNone(address_str) ? 0 : passStringToWasm0(address_str, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len0 = WASM_VECTOR_LEN;
            wasm.wasmtxbuilder_updateRecipient(retptr, this.__wbg_ptr, index, ptr0, len0, !isLikeNone(amount), isLikeNone(amount) ? BigInt(0) : amount);
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
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.wasmtxbuilder_getFeeRate(retptr, this.__wbg_ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r2 = getBigInt64Memory0()[retptr / 8 + 1];
            return r0 === 0 ? undefined : BigInt.asUintN(64, r2);
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
    * @returns {Promise<WasmPsbt>}
    */
    createPsbt(network) {
        const ret = wasm.wasmtxbuilder_createPsbt(this.__wbg_ptr, network);
        return takeObject(ret);
    }
    /**
    * @param {WasmNetwork} network
    * @param {boolean | undefined} [allow_dust]
    * @returns {Promise<WasmPsbt>}
    */
    createDraftPsbt(network, allow_dust) {
        const ret = wasm.wasmtxbuilder_createDraftPsbt(this.__wbg_ptr, network, isLikeNone(allow_dust) ? 0xFFFFFF : allow_dust ? 1 : 0);
        return takeObject(ret);
    }
}

const WasmTxOutFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmtxout_free(ptr >>> 0));
/**
*/
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
    * @returns {string}
    */
    get address() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.__wbg_get_wasmtxout_address(retptr, this.__wbg_ptr);
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
    set address(arg0) {
        const ptr0 = passStringToWasm0(arg0, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmtxout_address(this.__wbg_ptr, ptr0, len0);
    }
}

const WasmUserSettingsDataFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmusersettingsdata_free(ptr >>> 0));
/**
*/
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
        wasm.__wbg_wasmusersettingsdata_free(ptr);
    }
    /**
    * @returns {WasmUserSettings}
    */
    get 0() {
        const ret = wasm.__wbg_get_wasmusersettingsdata_0(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @param {WasmUserSettings} arg0
    */
    set 0(arg0) {
        wasm.__wbg_set_wasmusersettingsdata_0(this.__wbg_ptr, addHeapObject(arg0));
    }
}

const WasmUtxoFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmutxo_free(ptr >>> 0));
/**
*/
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
}

const WasmUtxoArrayFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmutxoarray_free(ptr >>> 0));
/**
*/
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
        wasm.__wbg_wasmutxoarray_free(ptr);
    }
    /**
    * @returns {(WasmUtxo)[]}
    */
    get 0() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.__wbg_get_wasmutxoarray_0(retptr, this.__wbg_ptr);
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
    * @param {(WasmUtxo)[]} arg0
    */
    set 0(arg0) {
        const ptr0 = passArrayJsValueToWasm0(arg0, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.__wbg_set_wasmutxoarray_0(this.__wbg_ptr, ptr0, len0);
    }
}

const WasmWalletFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmwallet_free(ptr >>> 0));
/**
*/
export class WasmWallet {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmWalletFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmwallet_free(ptr);
    }
    /**
    * @param {WasmNetwork} network
    * @param {string} bip39_mnemonic
    * @param {string | undefined} [bip38_passphrase]
    */
    constructor(network, bip39_mnemonic, bip38_passphrase) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(bip39_mnemonic, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            var ptr1 = isLikeNone(bip38_passphrase) ? 0 : passStringToWasm0(bip38_passphrase, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len1 = WASM_VECTOR_LEN;
            wasm.wasmwallet_new(retptr, network, ptr0, len0, ptr1, len1);
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
    * @param {number} script_type
    * @param {string} derivation_path
    * @returns {WasmAccount}
    */
    addAccount(script_type, derivation_path) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(derivation_path, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            wasm.wasmwallet_addAccount(retptr, this.__wbg_ptr, script_type, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            if (r2) {
                throw takeObject(r1);
            }
            return WasmAccount.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {WasmProtonWalletApiClient} api_client
    * @returns {Promise<WasmDiscoveredAccounts>}
    */
    discoverAccounts(api_client) {
        _assertClass(api_client, WasmProtonWalletApiClient);
        const ret = wasm.wasmwallet_discoverAccounts(this.__wbg_ptr, api_client.__wbg_ptr);
        return takeObject(ret);
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
    * @returns {Promise<WasmBalance>}
    */
    getBalance() {
        const ret = wasm.wasmwallet_getBalance(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @param {WasmPagination | undefined} [pagination]
    * @param {WasmSortOrder | undefined} [sort]
    * @returns {Promise<WasmTransactionDetailsArray>}
    */
    getTransactions(pagination, sort) {
        const ret = wasm.wasmwallet_getTransactions(this.__wbg_ptr, isLikeNone(pagination) ? 0 : addHeapObject(pagination), isLikeNone(sort) ? 2 : sort);
        return takeObject(ret);
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
    /**
    */
    clearStore() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.wasmwallet_clearStore(retptr, this.__wbg_ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}

const WasmWalletAccountAddressDataFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmwalletaccountaddressdata_free(ptr >>> 0));
/**
*/
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
        wasm.__wbg_wasmwalletaccountaddressdata_free(ptr);
    }
    /**
    * @returns {WasmApiEmailAddress}
    */
    get Data() {
        const ret = wasm.__wbg_get_wasmwalletaccountaddressdata_Data(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @param {WasmApiEmailAddress} arg0
    */
    set Data(arg0) {
        wasm.__wbg_set_wasmwalletaccountaddressdata_Data(this.__wbg_ptr, addHeapObject(arg0));
    }
}

const WasmWalletAccountDataFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmwalletaccountdata_free(ptr >>> 0));
/**
*/
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
        wasm.__wbg_wasmwalletaccountdata_free(ptr);
    }
    /**
    * @returns {WasmApiWalletAccount}
    */
    get Data() {
        const ret = wasm.__wbg_get_wasmwalletaccountdata_Data(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @param {WasmApiWalletAccount} arg0
    */
    set Data(arg0) {
        wasm.__wbg_set_wasmwalletaccountdata_Data(this.__wbg_ptr, addHeapObject(arg0));
    }
}

const WasmWalletClientFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmwalletclient_free(ptr >>> 0));
/**
*/
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
        wasm.__wbg_wasmwalletclient_free(ptr);
    }
    /**
    * @returns {Promise<WasmApiWalletsData>}
    */
    getWallets() {
        const ret = wasm.wasmwalletclient_getWallets(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @param {string} name
    * @param {boolean} is_imported
    * @param {number} wallet_type
    * @param {boolean} has_passphrase
    * @param {string} user_key_id
    * @param {string} wallet_key
    * @param {string} wallet_key_signature
    * @param {string | undefined} [mnemonic]
    * @param {string | undefined} [fingerprint]
    * @param {string | undefined} [public_key]
    * @param {boolean | undefined} [is_auto_created]
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
        return takeObject(ret);
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
        return takeObject(ret);
    }
    /**
    * @param {string} wallet_id
    * @returns {Promise<void>}
    */
    disableShowWalletRecovery(wallet_id) {
        const ptr0 = passStringToWasm0(wallet_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmwalletclient_disableShowWalletRecovery(this.__wbg_ptr, ptr0, len0);
        return takeObject(ret);
    }
    /**
    * @param {string} wallet_id
    * @returns {Promise<void>}
    */
    deleteWallet(wallet_id) {
        const ptr0 = passStringToWasm0(wallet_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmwalletclient_deleteWallet(this.__wbg_ptr, ptr0, len0);
        return takeObject(ret);
    }
    /**
    * @param {string} wallet_id
    * @returns {Promise<WasmApiWalletAccounts>}
    */
    getWalletAccounts(wallet_id) {
        const ptr0 = passStringToWasm0(wallet_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmwalletclient_getWalletAccounts(this.__wbg_ptr, ptr0, len0);
        return takeObject(ret);
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
        return takeObject(ret);
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
        return takeObject(ret);
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
        const ret = wasm.wasmwalletclient_updateWalletAccountFiatCurrency(this.__wbg_ptr, ptr0, len0, ptr1, len1, addHeapObject(symbol));
        return takeObject(ret);
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
        return takeObject(ret);
    }
    /**
    * @param {string} wallet_id
    * @param {(string)[]} wallet_account_ids
    * @returns {Promise<WasmApiWalletAccounts>}
    */
    updateWalletAccountsOrder(wallet_id, wallet_account_ids) {
        const ptr0 = passStringToWasm0(wallet_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArrayJsValueToWasm0(wallet_account_ids, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.wasmwalletclient_updateWalletAccountsOrder(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return takeObject(ret);
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
        return takeObject(ret);
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
        return takeObject(ret);
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
        return takeObject(ret);
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
        return takeObject(ret);
    }
    /**
    * @param {string} wallet_id
    * @param {string | undefined} [wallet_account_id]
    * @param {(string)[] | undefined} [hashed_txids]
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
        return takeObject(ret);
    }
    /**
    * @param {string} wallet_id
    * @param {string | undefined} [wallet_account_id]
    * @returns {Promise<WasmApiWalletTransactions>}
    */
    getWalletTransactionsToHash(wallet_id, wallet_account_id) {
        const ptr0 = passStringToWasm0(wallet_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        var ptr1 = isLikeNone(wallet_account_id) ? 0 : passStringToWasm0(wallet_account_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        const ret = wasm.wasmwalletclient_getWalletTransactionsToHash(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return takeObject(ret);
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
        const ret = wasm.wasmwalletclient_createWalletTransaction(this.__wbg_ptr, ptr0, len0, ptr1, len1, addHeapObject(payload));
        return takeObject(ret);
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
        return takeObject(ret);
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
        return takeObject(ret);
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
        return takeObject(ret);
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
        return takeObject(ret);
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
        return takeObject(ret);
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
        return takeObject(ret);
    }
}

const WasmWrappedPriceGraphFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmwrappedpricegraph_free(ptr >>> 0));
/**
*/
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
        wasm.__wbg_wasmwrappedpricegraph_free(ptr);
    }
    /**
    * @returns {WasmPriceGraph}
    */
    get data() {
        const ret = wasm.__wbg_get_wasmwrappedpricegraph_data(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
    * @param {WasmPriceGraph} arg0
    */
    set data(arg0) {
        wasm.__wbg_set_wasmwrappedpricegraph_data(this.__wbg_ptr, addHeapObject(arg0));
    }
}

export function __wbindgen_object_drop_ref(arg0) {
    takeObject(arg0);
};

export function __wbindgen_number_new(arg0) {
    const ret = arg0;
    return addHeapObject(ret);
};

export function __wbindgen_object_clone_ref(arg0) {
    const ret = getObject(arg0);
    return addHeapObject(ret);
};

export function __wbindgen_bigint_from_u64(arg0) {
    const ret = BigInt.asUintN(64, arg0);
    return addHeapObject(ret);
};

export function __wbg_wasmusersettingsdata_new(arg0) {
    const ret = WasmUserSettingsData.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbg_wasmtransactiondetailsdata_new(arg0) {
    const ret = WasmTransactionDetailsData.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbg_wasmpsbt_new(arg0) {
    const ret = WasmPsbt.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbg_wasmapifiatcurrencydata_new(arg0) {
    const ret = WasmApiFiatCurrencyData.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbg_wasmapiwalletdata_new(arg0) {
    const ret = WasmApiWalletData.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbg_wasmpsbtrecipient_new(arg0) {
    const ret = WasmPsbtRecipient.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbg_wasmapiwalletbitcoinaddressdata_new(arg0) {
    const ret = WasmApiWalletBitcoinAddressData.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbg_wasmapibitcoinaddresscreationpayloaddata_new(arg0) {
    const ret = WasmApiBitcoinAddressCreationPayloadData.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbg_wasmremainingmonthlyinvitations_new(arg0) {
    const ret = WasmRemainingMonthlyInvitations.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbg_wasmtxbuilder_new(arg0) {
    const ret = WasmTxBuilder.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbg_wasmapiwallettransactiondata_new(arg0) {
    const ret = WasmApiWalletTransactionData.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbg_wasmapiexchangeratedata_new(arg0) {
    const ret = WasmApiExchangeRateData.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbg_wasmrecipient_new(arg0) {
    const ret = WasmRecipient.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbg_wasmbalance_new(arg0) {
    const ret = WasmBalance.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbg_wasmutxo_new(arg0) {
    const ret = WasmUtxo.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbg_wasmaddressinfo_new(arg0) {
    const ret = WasmAddressInfo.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbg_wasmwalletaccountdata_new(arg0) {
    const ret = WasmWalletAccountData.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbg_wasmpaymentmethodsandprovidertupple_new(arg0) {
    const ret = WasmPaymentMethodsAndProviderTupple.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbg_wasmquotesbyprovider_new(arg0) {
    const ret = WasmQuotesByProvider.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbg_wasmtransactiondetailsarray_new(arg0) {
    const ret = WasmTransactionDetailsArray.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbg_wasmcountriesbyprovider_new(arg0) {
    const ret = WasmCountriesByProvider.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbg_wasmapiwalletbitcoinaddresslookupdata_new(arg0) {
    const ret = WasmApiWalletBitcoinAddressLookupData.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbg_wasmapiwalletaccounts_new(arg0) {
    const ret = WasmApiWalletAccounts.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbg_wasmcountriesandprovidertupple_new(arg0) {
    const ret = WasmCountriesAndProviderTupple.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbg_wasmpaymentmethodsbyprovider_new(arg0) {
    const ret = WasmPaymentMethodsByProvider.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbg_wasmapifiatcurrencies_new(arg0) {
    const ret = WasmApiFiatCurrencies.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbg_wasmapiwalletbitcoinaddresses_new(arg0) {
    const ret = WasmApiWalletBitcoinAddresses.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbg_wasmdiscoveredaccounts_new(arg0) {
    const ret = WasmDiscoveredAccounts.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbg_wasmfiatcurrenciesbyprovider_new(arg0) {
    const ret = WasmFiatCurrenciesByProvider.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbg_wasmquotesandprovidertupple_new(arg0) {
    const ret = WasmQuotesAndProviderTupple.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbg_wasmapiwallettransactions_new(arg0) {
    const ret = WasmApiWalletTransactions.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbg_wasmapiwalletaccountaddresses_new(arg0) {
    const ret = WasmApiWalletAccountAddresses.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbg_wasmapiwalletsdata_new(arg0) {
    const ret = WasmApiWalletsData.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbg_wasmoutpoint_new(arg0) {
    const ret = WasmOutPoint.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbg_wasmfiatcurrenciesandprovidertupple_new(arg0) {
    const ret = WasmFiatCurrenciesAndProviderTupple.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbg_wasmutxoarray_new(arg0) {
    const ret = WasmUtxoArray.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbg_wasmwalletaccountaddressdata_new(arg0) {
    const ret = WasmWalletAccountAddressData.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbg_wasmdiscoveredaccount_new(arg0) {
    const ret = WasmDiscoveredAccount.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbg_wasmwrappedpricegraph_new(arg0) {
    const ret = WasmWrappedPriceGraph.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbg_wasmapifiatcurrencydata_unwrap(arg0) {
    const ret = WasmApiFiatCurrencyData.__unwrap(takeObject(arg0));
    return ret;
};

export function __wbg_wasmapiwalletdata_unwrap(arg0) {
    const ret = WasmApiWalletData.__unwrap(takeObject(arg0));
    return ret;
};

export function __wbg_wasmwalletaccountdata_unwrap(arg0) {
    const ret = WasmWalletAccountData.__unwrap(takeObject(arg0));
    return ret;
};

export function __wbg_wasmwalletaccountaddressdata_unwrap(arg0) {
    const ret = WasmWalletAccountAddressData.__unwrap(takeObject(arg0));
    return ret;
};

export function __wbg_wasmapiwallettransactiondata_unwrap(arg0) {
    const ret = WasmApiWalletTransactionData.__unwrap(takeObject(arg0));
    return ret;
};

export function __wbindgen_string_new(arg0, arg1) {
    const ret = getStringFromWasm0(arg0, arg1);
    return addHeapObject(ret);
};

export function __wbg_wasmpsbtrecipient_unwrap(arg0) {
    const ret = WasmPsbtRecipient.__unwrap(takeObject(arg0));
    return ret;
};

export function __wbindgen_json_parse(arg0, arg1) {
    const ret = JSON.parse(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
};

export function __wbindgen_json_serialize(arg0, arg1) {
    const obj = getObject(arg1);
    const ret = JSON.stringify(obj === undefined ? null : obj);
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len1;
    getInt32Memory0()[arg0 / 4 + 0] = ptr1;
};

export function __wbg_wasmapiwalletbitcoinaddressdata_unwrap(arg0) {
    const ret = WasmApiWalletBitcoinAddressData.__unwrap(takeObject(arg0));
    return ret;
};

export function __wbg_wasmapibitcoinaddresscreationpayloaddata_unwrap(arg0) {
    const ret = WasmApiBitcoinAddressCreationPayloadData.__unwrap(takeObject(arg0));
    return ret;
};

export function __wbg_wasmutxo_unwrap(arg0) {
    const ret = WasmUtxo.__unwrap(takeObject(arg0));
    return ret;
};

export function __wbg_wasmdiscoveredaccount_unwrap(arg0) {
    const ret = WasmDiscoveredAccount.__unwrap(takeObject(arg0));
    return ret;
};

export function __wbindgen_error_new(arg0, arg1) {
    const ret = new Error(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
};

export function __wbg_wasmcountriesandprovidertupple_unwrap(arg0) {
    const ret = WasmCountriesAndProviderTupple.__unwrap(takeObject(arg0));
    return ret;
};

export function __wbg_wasmfiatcurrenciesandprovidertupple_unwrap(arg0) {
    const ret = WasmFiatCurrenciesAndProviderTupple.__unwrap(takeObject(arg0));
    return ret;
};

export function __wbg_wasmpaymentmethodsandprovidertupple_unwrap(arg0) {
    const ret = WasmPaymentMethodsAndProviderTupple.__unwrap(takeObject(arg0));
    return ret;
};

export function __wbg_wasmquotesandprovidertupple_unwrap(arg0) {
    const ret = WasmQuotesAndProviderTupple.__unwrap(takeObject(arg0));
    return ret;
};

export function __wbg_wasmtransactiondetailsdata_unwrap(arg0) {
    const ret = WasmTransactionDetailsData.__unwrap(takeObject(arg0));
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

export function __wbindgen_is_object(arg0) {
    const val = getObject(arg0);
    const ret = typeof(val) === 'object' && val !== null;
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

export function __wbindgen_bigint_from_i64(arg0) {
    const ret = arg0;
    return addHeapObject(ret);
};

export function __wbg_set_f975102236d3c502(arg0, arg1, arg2) {
    getObject(arg0)[takeObject(arg1)] = takeObject(arg2);
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

export function __wbg_fetch_eadcbc7351113537(arg0) {
    const ret = fetch(getObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_queueMicrotask_3cbae2ec6b6cd3d6(arg0) {
    const ret = getObject(arg0).queueMicrotask;
    return addHeapObject(ret);
};

export function __wbindgen_is_function(arg0) {
    const ret = typeof(getObject(arg0)) === 'function';
    return ret;
};

export function __wbg_queueMicrotask_481971b0d87f3dd4(arg0) {
    queueMicrotask(getObject(arg0));
};

export function __wbg_instanceof_Window_f401953a2cf86220(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof Window;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_localStorage_e381d34d0c40c761() { return handleError(function (arg0) {
    const ret = getObject(arg0).localStorage;
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
}, arguments) };

export function __wbg_fetch_921fad6ef9e883dd(arg0, arg1) {
    const ret = getObject(arg0).fetch(getObject(arg1));
    return addHeapObject(ret);
};

export function __wbg_signal_a61f78a3478fd9bc(arg0) {
    const ret = getObject(arg0).signal;
    return addHeapObject(ret);
};

export function __wbg_new_0d76b0581eca6298() { return handleError(function () {
    const ret = new AbortController();
    return addHeapObject(ret);
}, arguments) };

export function __wbg_abort_2aa7521d5690750e(arg0) {
    getObject(arg0).abort();
};

export function __wbg_new_ab6fd82b10560829() { return handleError(function () {
    const ret = new Headers();
    return addHeapObject(ret);
}, arguments) };

export function __wbg_append_7bfcb4937d1d5e29() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).append(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
}, arguments) };

export function __wbg_newwithstrandinit_3fd6fba4083ff2d0() { return handleError(function (arg0, arg1, arg2) {
    const ret = new Request(getStringFromWasm0(arg0, arg1), getObject(arg2));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_getItem_164e8e5265095b87() { return handleError(function (arg0, arg1, arg2, arg3) {
    const ret = getObject(arg1).getItem(getStringFromWasm0(arg2, arg3));
    var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len1 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len1;
    getInt32Memory0()[arg0 / 4 + 0] = ptr1;
}, arguments) };

export function __wbg_set_2ff617abddd9098d() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0)[getStringFromWasm0(arg1, arg2)] = getStringFromWasm0(arg3, arg4);
}, arguments) };

export function __wbg_delete_808f42904ec49124() { return handleError(function (arg0, arg1, arg2) {
    delete getObject(arg0)[getStringFromWasm0(arg1, arg2)];
}, arguments) };

export function __wbg_instanceof_Response_849eb93e75734b6e(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof Response;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_url_5f6dc4009ac5f99d(arg0, arg1) {
    const ret = getObject(arg1).url;
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len1;
    getInt32Memory0()[arg0 / 4 + 0] = ptr1;
};

export function __wbg_status_61a01141acd3cf74(arg0) {
    const ret = getObject(arg0).status;
    return ret;
};

export function __wbg_headers_9620bfada380764a(arg0) {
    const ret = getObject(arg0).headers;
    return addHeapObject(ret);
};

export function __wbg_arrayBuffer_29931d52c7206b02() { return handleError(function (arg0) {
    const ret = getObject(arg0).arrayBuffer();
    return addHeapObject(ret);
}, arguments) };

export function __wbg_crypto_1d1f22824a6a080c(arg0) {
    const ret = getObject(arg0).crypto;
    return addHeapObject(ret);
};

export function __wbg_process_4a72847cc503995b(arg0) {
    const ret = getObject(arg0).process;
    return addHeapObject(ret);
};

export function __wbg_versions_f686565e586dd935(arg0) {
    const ret = getObject(arg0).versions;
    return addHeapObject(ret);
};

export function __wbg_node_104a2ff8d6ea03a2(arg0) {
    const ret = getObject(arg0).node;
    return addHeapObject(ret);
};

export function __wbindgen_is_string(arg0) {
    const ret = typeof(getObject(arg0)) === 'string';
    return ret;
};

export function __wbg_require_cca90b1a94a0255b() { return handleError(function () {
    const ret = module.require;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_msCrypto_eb05e62b530a1508(arg0) {
    const ret = getObject(arg0).msCrypto;
    return addHeapObject(ret);
};

export function __wbg_getRandomValues_3aa56aa6edec874c() { return handleError(function (arg0, arg1) {
    getObject(arg0).getRandomValues(getObject(arg1));
}, arguments) };

export function __wbg_randomFillSync_5c9c955aa56b6049() { return handleError(function (arg0, arg1) {
    getObject(arg0).randomFillSync(takeObject(arg1));
}, arguments) };

export function __wbg_new_16b304a2cfa7ff4a() {
    const ret = new Array();
    return addHeapObject(ret);
};

export function __wbg_newnoargs_e258087cd0daa0ea(arg0, arg1) {
    const ret = new Function(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
};

export function __wbg_new_d9bc3a0147634640() {
    const ret = new Map();
    return addHeapObject(ret);
};

export function __wbg_next_40fc327bfc8770e6(arg0) {
    const ret = getObject(arg0).next;
    return addHeapObject(ret);
};

export function __wbg_next_196c84450b364254() { return handleError(function (arg0) {
    const ret = getObject(arg0).next();
    return addHeapObject(ret);
}, arguments) };

export function __wbg_done_298b57d23c0fc80c(arg0) {
    const ret = getObject(arg0).done;
    return ret;
};

export function __wbg_value_d93c65011f51a456(arg0) {
    const ret = getObject(arg0).value;
    return addHeapObject(ret);
};

export function __wbg_iterator_2cee6dadfd956dfa() {
    const ret = Symbol.iterator;
    return addHeapObject(ret);
};

export function __wbg_get_e3c254076557e348() { return handleError(function (arg0, arg1) {
    const ret = Reflect.get(getObject(arg0), getObject(arg1));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_call_27c0f87801dedf93() { return handleError(function (arg0, arg1) {
    const ret = getObject(arg0).call(getObject(arg1));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_new_72fb9a18b5ae2624() {
    const ret = new Object();
    return addHeapObject(ret);
};

export function __wbg_self_ce0dbfc45cf2f5be() { return handleError(function () {
    const ret = self.self;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_window_c6fb939a7f436783() { return handleError(function () {
    const ret = window.window;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_globalThis_d1e6af4856ba331b() { return handleError(function () {
    const ret = globalThis.globalThis;
    return addHeapObject(ret);
}, arguments) };

export function __wbg_global_207b558942527489() { return handleError(function () {
    const ret = global.global;
    return addHeapObject(ret);
}, arguments) };

export function __wbindgen_is_undefined(arg0) {
    const ret = getObject(arg0) === undefined;
    return ret;
};

export function __wbg_set_d4638f722068f043(arg0, arg1, arg2) {
    getObject(arg0)[arg1 >>> 0] = takeObject(arg2);
};

export function __wbg_new_28c511d9baebfa89(arg0, arg1) {
    const ret = new Error(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
};

export function __wbg_call_b3ca7c6051f9bec1() { return handleError(function (arg0, arg1, arg2) {
    const ret = getObject(arg0).call(getObject(arg1), getObject(arg2));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_set_8417257aaedc936b(arg0, arg1, arg2) {
    const ret = getObject(arg0).set(getObject(arg1), getObject(arg2));
    return addHeapObject(ret);
};

export function __wbg_now_3014639a94423537() {
    const ret = Date.now();
    return ret;
};

export function __wbg_new_81740750da40724f(arg0, arg1) {
    try {
        var state0 = {a: arg0, b: arg1};
        var cb0 = (arg0, arg1) => {
            const a = state0.a;
            state0.a = 0;
            try {
                return __wbg_adapter_563(a, state0.b, arg0, arg1);
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

export function __wbg_resolve_b0083a7967828ec8(arg0) {
    const ret = Promise.resolve(getObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_then_0c86a60e8fcfe9f6(arg0, arg1) {
    const ret = getObject(arg0).then(getObject(arg1));
    return addHeapObject(ret);
};

export function __wbg_then_a73caa9a87991566(arg0, arg1, arg2) {
    const ret = getObject(arg0).then(getObject(arg1), getObject(arg2));
    return addHeapObject(ret);
};

export function __wbg_buffer_12d079cc21e14bdb(arg0) {
    const ret = getObject(arg0).buffer;
    return addHeapObject(ret);
};

export function __wbg_newwithbyteoffsetandlength_aa4a17c33a06e5cb(arg0, arg1, arg2) {
    const ret = new Uint8Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_new_63b92bc8671ed464(arg0) {
    const ret = new Uint8Array(getObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_set_a47bac70306a19a7(arg0, arg1, arg2) {
    getObject(arg0).set(getObject(arg1), arg2 >>> 0);
};

export function __wbg_length_c20a40f15020d68a(arg0) {
    const ret = getObject(arg0).length;
    return ret;
};

export function __wbg_newwithlength_e9b4878cebadb3d3(arg0) {
    const ret = new Uint8Array(arg0 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_subarray_a1f73cd4b5b42fe1(arg0, arg1, arg2) {
    const ret = getObject(arg0).subarray(arg1 >>> 0, arg2 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_has_0af94d20077affa2() { return handleError(function (arg0, arg1) {
    const ret = Reflect.has(getObject(arg0), getObject(arg1));
    return ret;
}, arguments) };

export function __wbg_set_1f9b04f170055d33() { return handleError(function (arg0, arg1, arg2) {
    const ret = Reflect.set(getObject(arg0), getObject(arg1), getObject(arg2));
    return ret;
}, arguments) };

export function __wbg_stringify_8887fe74e1c50d81() { return handleError(function (arg0) {
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

export function __wbindgen_closure_wrapper11082(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 1827, __wbg_adapter_38);
    return addHeapObject(ret);
};


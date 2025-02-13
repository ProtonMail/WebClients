import * as wasm from "./index_bg.wasm";
export * from "./index_bg.js";
import { __wbg_set_wasm } from "./index_bg.js";
__wbg_set_wasm(wasm);
wasm.__wbindgen_start();

import * as PassRustUI from '@protontech/pass-rust-core/ui/proton_pass_web_bg';
import { __wbg_set_wasm } from '@protontech/pass-rust-core/ui/proton_pass_web_bg';
import fs from 'fs';

const wasmBuffer = fs.readFileSync('../../node_modules/@protontech/pass-rust-core/ui/proton_pass_web_bg.wasm');
const wasmModule = new WebAssembly.Module(wasmBuffer);
const wasm = new WebAssembly.Instance(wasmModule, { './proton_pass_web_bg.js': PassRustUI });

__wbg_set_wasm(wasm.exports);

export default PassRustUI;

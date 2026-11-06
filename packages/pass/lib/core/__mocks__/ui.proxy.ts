import * as PassRustUI from '@protontech/pass-rust-core/ui/proton_pass_web_bg';
import { __wbg_set_wasm } from '@protontech/pass-rust-core/ui/proton_pass_web_bg';
import fs from 'fs';

const wasmBuffer = fs.readFileSync(require.resolve('@protontech/pass-rust-core/ui/proton_pass_web_bg.wasm'));
const wasmModule = new WebAssembly.Module(wasmBuffer);
const wasm = new WebAssembly.Instance(wasmModule, {
    './proton_pass_web_bg.js': PassRustUI as unknown as WebAssembly.ModuleImports,
});

__wbg_set_wasm(wasm.exports);

export const preloadPassUI = async () => undefined;

export default PassRustUI;

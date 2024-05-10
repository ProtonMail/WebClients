import { c } from 'ttag';

import { DetailledWasmError, WasmError } from '../../../pkg';

const humanReadableByError: Record<WasmError, () => string> = {
    [WasmError.BdkError]: () => c('Wasm Error').t`BDK Error`,
    [WasmError.Bip32Error]: () => c('Wasm Error').t`Bip32 error`,
    [WasmError.Bip39Error]: () => c('Wasm Error').t`Bip39 error`,
    [WasmError.AccountNotFound]: () => c('Wasm Error').t`Account not found`,
    [WasmError.CannotBroadcastTransaction]: () => c('Wasm Error').t`Could not broadcast the transaction`,
    [WasmError.CannotComputeTxFees]: () => c('Wasm Error').t`Cannot compute fees for the transaction`,
    [WasmError.CannotCreateAddressFromScript]: () => c('Wasm Error').t`Cannot create address from script`,
    [WasmError.CannotFindPersistedData]: () => c('Wasm Error').t`Cannot find data in persistence space`,
    [WasmError.CannotGetAddressFromScript]: () => c('Wasm Error').t`Cannot get address from provided script`,
    [WasmError.CannotGetLocalStorage]: () => c('Wasm Error').t`Cannot access to local storage`,
    [WasmError.CannotGetFeeEstimation]: () => c('Wasm Error').t`Cannot fetch fees estimations`,
    [WasmError.CannotSignPsbt]: () => c('Wasm Error').t`An error occured when signing PSBT`,
    [WasmError.DerivationError]: () => c('Wasm Error').t`Could derive extended key`,
    [WasmError.DescriptorError]: () => c('Wasm Error').t`An error occured with descriptor`,
    [WasmError.InvalidAccountIndex]: () => c('Wasm Error').t`Provided account index is invalid`,
    [WasmError.InvalidAddress]: () => c('Wasm Error').t`The provided address is invalid`,
    [WasmError.InvalidData]: () => c('Wasm Error').t`Invalid data provided`,
    [WasmError.InvalidDerivationPath]: () => c('Wasm Error').t`Provided derivation path is invalid`,
    [WasmError.InvalidDescriptor]: () => c('Wasm Error').t`Provided descriptor is invalid`,
    [WasmError.InvalidMnemonic]: () => c('Wasm Error').t`Provided mnemonic is invalid`,
    [WasmError.InvalidNetwork]: () => c('Wasm Error').t`You are using an address for another network`,
    [WasmError.InvalidScriptType]: () => c('Wasm Error').t`Provided script type is invalid`,
    [WasmError.InvalidSecretKey]: () => c('Wasm Error').t`Provided secret key is invalid`,
    [WasmError.InvalidTxId]: () => c('Wasm Error').t`Invalid transaction id provided`,
    [WasmError.LoadError]: () => c('Wasm Error').t`Could not load data`,
    [WasmError.NoWindowContext]: () => c('Wasm Error').t`You must run ProtonWallet web in a modern browser context`,
    // [WasmError.NoWindowContext]: () => c('Wasm Error').t`Web wallet needs to be run in a Web Browser`,
    [WasmError.OutpointParsingError]: () => c('Wasm Error').t`Could not parse Outpoint`,
    [WasmError.SyncError]: () => c('Wasm Error').t`Could not sync wallet with blockchain`,
    [WasmError.TransactionNotFound]: () => c('Wasm Error').t`The transaction was not found`,
};

export const getHumanReadableErrorFromWasmError = (error: WasmError) => {
    return humanReadableByError[error]();
};

export const tryHandleWasmError = (error: unknown) => {
    if (error instanceof DetailledWasmError) {
        return getHumanReadableErrorFromWasmError(error.kind);
    }

    return null;
};

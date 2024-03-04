import { c } from 'ttag';

import { DetailledWasmError, WasmError } from '@proton/andromeda';

const humanReadableByError: Record<WasmError, () => string> = {
    [WasmError.ApiError]: () => c('Wasm Error').t`An networking error occured`,
    [WasmError.AddUtxoError]: () => c('Wasm Error').t`Could not add provided utxo to transaction`,
    [WasmError.BdkError]: () => c('Wasm Error').t`BDK Error`,
    [WasmError.Bip32Error]: () => c('Wasm Error').t`Bip32 error`,
    [WasmError.Bip39Error]: () => c('Wasm Error').t`Bip39 error`,
    [WasmError.AccountNotFound]: () => c('Wasm Error').t`Account not found`,
    [WasmError.CannotBroadcastTransaction]: () => c('Wasm Error').t`Could not broadcast the transaction`,
    [WasmError.CannotComputeTxFees]: () => c('Wasm Error').t`Cannot compute fees for the transaction`,
    [WasmError.CannotCreateAddressFromScript]: () => c('Wasm Error').t`Cannot create address from script`,
    [WasmError.CannotFindPersistedData]: () => c('Wasm Error').t`Cannot find persisted data in local storage`,
    [WasmError.CannotGetAddressFromScript]: () => c('Wasm Error').t`Cannot get address from provided script`,
    [WasmError.CannotGetFeeEstimation]: () => c('Wasm Error').t`Cannot fetch fees estimations`,
    [WasmError.CannotGetLocalStorage]: () => c('Wasm Error').t`Cannot get access to local storage`,
    [WasmError.CannotParsePersistedData]: () => c('Wasm Error').t`Cannot parse persisted data`,
    [WasmError.CannotPersistData]: () => c('Wasm Error').t`Cannot persist data`,
    [WasmError.CannotSerializePersistedData]: () => c('Wasm Error').t`Cannot serialise data`,
    [WasmError.CannotSignPsbt]: () => c('Wasm Error').t`An error occured when signing PSBT`,
    [WasmError.CreateTxError]: () => c('Wasm Error').t`Cannot create transaction`,
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
    [WasmError.NewWalletError]: () => c('Wasm Error').t`Cannot build wallet`,
    [WasmError.NoWindowContext]: () => c('Wasm Error').t`ProtonWallet web must be run in a browser environment`,
    [WasmError.OutpointParsingError]: () => c('Wasm Error').t`Could not parse Outpoint`,
    [WasmError.SignerError]: () => c('Wasm Error').t`Cannot sign transaction`,
    [WasmError.SyncError]: () => c('Wasm Error').t`Could not sync wallet with blockchain`,
    [WasmError.TransactionNotFound]: () => c('Wasm Error').t`The transaction was not found`,
    [WasmError.WriteError]: () => c('Wasm Error').t`Cannot write data to persistence`,
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

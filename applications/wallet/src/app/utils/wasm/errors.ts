import { c } from 'ttag';

import { DetailledWasmError, WasmError } from '../../../pkg';

const humanReadableByError: Record<WasmError, () => string> = {
    [WasmError.Bip32]: () => c('Wasm Error').t`An error occured with BIP32`,
    [WasmError.BnBNoExactMatch]: () =>
        c('Wasm Error').t`Could not find exact match for 'branch and bound' coin selection`,
    [WasmError.BnBTotalTriesExceeded]: () =>
        c('Wasm Error').t`Maximum 'branch and bound' coin selection possible attempts reached`,
    [WasmError.CannotComputeTxFees]: () => c('Wasm Error').t`Cannot compute fees for the transaction`,
    [WasmError.CannotFindPersistedData]: () => c('Wasm Error').t`Could not find persist data`,
    [WasmError.CannotGetFeeEstimation]: () => c('Wasm Error').t`Cannot fetch fees estimations`,
    [WasmError.CannotGetLocalStorage]: () => c('Wasm Error').t`Could not get access to local storage`,
    [WasmError.CannotParsePersistedData]: () => c('Wasm Error').t`Could not read persist data`,
    [WasmError.CannotPersistData]: () => c('Wasm Error').t`Could not write persist data`,
    [WasmError.CannotSerializePersistedData]: () => c('Wasm Error').t`Could not write persisted data`,
    [WasmError.CannotSignPsbt]: () => c('Wasm Error').t`An error occured when signing PSBT`,
    [WasmError.ChecksumMismatch]: () => c('Wasm Error').t`Checksum does not match`,
    [WasmError.DerivationError]: () => c('Wasm Error').t`Could derive extended key`,
    [WasmError.Descriptor]: () => c('Wasm Error').t`An error occured with descriptor`,
    [WasmError.FeeRateTooLow]: () => c('Wasm Error').t`Used fee rate is too low`,
    [WasmError.FeeRateUnavailable]: () => c('Wasm Error').t`Fee rate is not available`,
    [WasmError.FeeTooLow]: () => c('Wasm Error').t`Used fees are too low`,
    [WasmError.Generic]: () => c('Wasm Error').t`An error occured`,
    [WasmError.InsufficientFunds]: () => c('Wasm Error').t`You don't have enough funds to send this transaction`,
    [WasmError.InvalidAccountIndex]: () => c('Wasm Error').t`Provided account index is invalid`,
    [WasmError.InvalidAddress]: () => c('Wasm Error').t`The provided address is invalid`,
    [WasmError.InvalidData]: () => c('Wasm Error').t`Invalid data provided`,
    [WasmError.InvalidDerivationPath]: () => c('Wasm Error').t`Provided derivation path is invalid`,
    [WasmError.InvalidDescriptor]: () => c('Wasm Error').t`Provided descriptor is invalid`,
    [WasmError.InvalidMnemonic]: () => c('Wasm Error').t`Provided mnemonic is invalid`,
    [WasmError.InvalidNetwork]: () => c('Wasm Error').t`You are using an address for another network`,
    [WasmError.InvalidOutpoint]: () => c('Wasm Error').t`Provided outpoint is invalid`,
    [WasmError.InvalidPolicyPathError]: () => c('Wasm Error').t`Policy path is invalid`,
    [WasmError.InvalidSecretKey]: () => c('Wasm Error').t`Provided secret key is invalid`,
    [WasmError.InvalidSeed]: () => c('Wasm Error').t`Provided seed is invalid`,
    [WasmError.InvalidTxId]: () => c('Wasm Error').t`Invalid transaction id provided`,
    [WasmError.IrreplaceableTransaction]: () => c('Wasm Error').t`Transaction is not replaceable`,
    [WasmError.Key]: () => c('Wasm Error').t`An error occured on key process`,
    [WasmError.Miniscript]: () => c('Wasm Error').t`An error occured with miniscipt`,
    [WasmError.MiniscriptPsbt]: () => c('Wasm Error').t`An error occured with miniscipt PSBT`,
    [WasmError.MissingKeyOrigin]: () => c('Wasm Error').t`Key origin is missing`,
    [WasmError.NoRecipients]: () => c('Wasm Error').t`No recipients provided`,
    [WasmError.NoUtxosSelected]: () => c('Wasm Error').t`No utxos were selected`,
    [WasmError.NoWindowContext]: () => c('Wasm Error').t`Web wallet needs to be run in a Web Browser`,
    [WasmError.OutpointParsingError]: () => c('Wasm Error').t`Could not parse Outpoint`,
    [WasmError.OutputBelowDustLimit]: () => c('Wasm Error').t`One output is below dust limit`,
    [WasmError.Psbt]: () => c('Wasm Error').t`An error occured with used PSBT`,
    [WasmError.Signer]: () => c('Wasm Error').t`An error occured with signed`,
    [WasmError.SpendingPolicyRequired]: () => c('Wasm Error').t`A spending policy is required`,
    [WasmError.SyncError]: () => c('Wasm Error').t`Could not sync wallet with blockchain`,
    [WasmError.TransactionConfirmed]: () => c('Wasm Error').t`Transaction is already confirmed`,
    [WasmError.TransactionNotFound]: () => c('Wasm Error').t`The transaction was not found`,
    [WasmError.UnknownUtxo]: () => c('Wasm Error').t`Provided utxo is unknow`,
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

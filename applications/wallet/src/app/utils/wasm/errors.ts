import { c } from 'ttag';

import { DetailledWasmError, WasmError } from '../../../pkg';

const humanReadableByError: Record<WasmError, () => string> = {
    [WasmError.InvalidSecretKey]: () => c('Wasm Error').t`Provided secret key is invalid`,
    [WasmError.InvalidDescriptor]: () => c('Wasm Error').t`Provided descriptor is invalid`,
    [WasmError.InvalidDerivationPath]: () => c('Wasm Error').t`Provided derivation path is invalid`,
    [WasmError.InvalidAccountIndex]: () => c('Wasm Error').t`Provided account index is invalid`,
    [WasmError.CannotSignPsbt]: () => c('Wasm Error').t`An error occured when signing PSBT`,
    [WasmError.DerivationError]: () => c('Wasm Error').t`Could derive extended key`,
    [WasmError.SyncError]: () => c('Wasm Error').t`Could not sync wallet with blockchain`,
    [WasmError.InvalidAddress]: () => c('Wasm Error').t`The provided address is invalid`,
    [WasmError.OutpointParsingError]: () => c('Wasm Error').t`Could not parse Outpoint`,
    [WasmError.CannotGetFeeEstimation]: () => c('Wasm Error').t`Cannot fetch fees estimations`,
    [WasmError.InvalidData]: () => c('Wasm Error').t`Invalid data provided`,
    [WasmError.InvalidTxId]: () => c('Wasm Error').t`Invalid transaction id provided`,
    [WasmError.CannotComputeTxFees]: () => c('Wasm Error').t`Cannot compute fees for the transaction`,
    [WasmError.InvalidMnemonic]: () => c('Wasm Error').t`Provided mnemonic is invalid`,
    [WasmError.InvalidSeed]: () => c('Wasm Error').t`Provided seed is invalid`,
    [WasmError.Generic]: () => c('Wasm Error').t`An error occured`,
    [WasmError.NoRecipients]: () => c('Wasm Error').t`No recipients provided`,
    [WasmError.NoUtxosSelected]: () => c('Wasm Error').t`No utxos were selected`,
    [WasmError.OutputBelowDustLimit]: () => c('Wasm Error').t`One output is below dust limit`,
    [WasmError.InsufficientFunds]: () => c('Wasm Error').t`You don't have enough funds to send this transaction`,
    [WasmError.BnBTotalTriesExceeded]: () =>
        c('Wasm Error').t`Maximum 'branch and bound' coin selection possible attempts reached`,
    [WasmError.BnBNoExactMatch]: () =>
        c('Wasm Error').t`Could not find exact match for 'branch and bound' coin selection`,
    [WasmError.UnknownUtxo]: () => c('Wasm Error').t`Provided utxo is unknown`,
    [WasmError.TransactionNotFound]: () => c('Wasm Error').t`The transaction was not found`,
    [WasmError.TransactionConfirmed]: () => c('Wasm Error').t`Transaction is already confirmed`,
    [WasmError.IrreplaceableTransaction]: () => c('Wasm Error').t`Transaction is not replaceable`,
    [WasmError.FeeRateTooLow]: () => c('Wasm Error').t`Used fee rate is too low`,
    [WasmError.FeeTooLow]: () => c('Wasm Error').t`Used fees are too low`,
    [WasmError.FeeRateUnavailable]: () => c('Wasm Error').t`Fee rate is not available`,
    [WasmError.MissingKeyOrigin]: () => c('Wasm Error').t`Key origin is missing`,
    [WasmError.Key]: () => c('Wasm Error').t`An error occured on key process`,
    [WasmError.ChecksumMismatch]: () => c('Wasm Error').t`Checksum does not match`,
    [WasmError.SpendingPolicyRequired]: () => c('Wasm Error').t`A spending policy is required`,
    [WasmError.InvalidPolicyPathError]: () => c('Wasm Error').t`Policy path is invalid`,
    [WasmError.Signer]: () => c('Wasm Error').t`An error occured with signed`,
    [WasmError.InvalidOutpoint]: () => c('Wasm Error').t`Provided outpoint is invalid`,
    [WasmError.Descriptor]: () => c('Wasm Error').t`An error occured with descriptor`,
    [WasmError.Miniscript]: () => c('Wasm Error').t`An error occured with miniscipt`,
    [WasmError.MiniscriptPsbt]: () => c('Wasm Error').t`An error occured with miniscipt PSBT`,
    [WasmError.Bip32]: () => c('Wasm Error').t`An error occured with BIP32`,
    [WasmError.Psbt]: () => c('Wasm Error').t`An error occured with used PSBT`,
};

const getHumanReadbleErrorFromWasmError = (error: WasmError) => {
    return humanReadableByError[error]();
};

export const tryHandleWasmError = (error: unknown) => {
    if (error instanceof DetailledWasmError) {
        return getHumanReadbleErrorFromWasmError(error.kind);
    }

    return null;
};

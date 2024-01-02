/* tslint:disable */
/* eslint-disable */
/**
* @returns {string}
*/
export function library_version(): string;
/**
*/
export function setPanicHook(): void;
/**
*/
export enum WasmNetwork {
/**
* Mainnet Bitcoin.
*/
  Bitcoin = 0,
/**
* Bitcoin's testnet network.
*/
  Testnet = 1,
/**
* Bitcoin's signet network.
*/
  Signet = 2,
/**
* Bitcoin's regtest network.
*/
  Regtest = 3,
}
/**
*/
export enum WasmError {
  InvalidSecretKey = 0,
  InvalidNetwork = 1,
  InvalidDescriptor = 2,
  InvalidDerivationPath = 3,
  InvalidAccountIndex = 4,
  DerivationError = 5,
  SyncError = 6,
  OutpointParsingError = 7,
  InvalidData = 8,
  InvalidAddress = 9,
  InvalidTxId = 10,
  CannotComputeTxFees = 11,
  InvalidMnemonic = 12,
  InvalidSeed = 13,
  CannotGetFeeEstimation = 14,
  CannotSignPsbt = 15,
  NoWindowContext = 16,
  CannotGetLocalStorage = 17,
  CannotSerializePersistedData = 18,
  CannotPersistData = 19,
  CannotFindPersistedData = 20,
  CannotParsePersistedData = 21,
  CannotGetAddressFromScript = 22,
  CannotCreateDescriptor = 23,
  DescriptorError = 24,
  LoadError = 25,
  CannotCreateAddressFromScript = 26,
  AccountNotFound = 27,
  Generic = 28,
  NoRecipients = 29,
  NoUtxosSelected = 30,
  OutputBelowDustLimit = 31,
  InsufficientFunds = 32,
  BnBTotalTriesExceeded = 33,
  BnBNoExactMatch = 34,
  UnknownUtxo = 35,
  TransactionNotFound = 36,
  TransactionConfirmed = 37,
  IrreplaceableTransaction = 38,
  FeeRateTooLow = 39,
  FeeTooLow = 40,
  FeeRateUnavailable = 41,
  MissingKeyOrigin = 42,
  Key = 43,
  ChecksumMismatch = 44,
  SpendingPolicyRequired = 45,
  InvalidPolicyPathError = 46,
  Signer = 47,
  InvalidOutpoint = 48,
  Descriptor = 49,
  Miniscript = 50,
  MiniscriptPsbt = 51,
  Bip32 = 52,
  Bip39 = 53,
  Psbt = 54,
  LockError = 55,
}
/**
*/
export enum WasmChangeSpendPolicy {
  ChangeAllowed = 0,
  OnlyChange = 1,
  ChangeForbidden = 2,
}
/**
*/
export enum WasmCoinSelection {
  BranchAndBound = 0,
  LargestFirst = 1,
  OldestFirst = 2,
  Manual = 3,
}
/**
*/
export enum WasmBitcoinUnit {
  BTC = 0,
  MBTC = 1,
  SAT = 2,
}
/**
*/
export enum WasmSupportedBIPs {
  Bip44 = 0,
  Bip49 = 1,
  Bip84 = 2,
  Bip86 = 3,
}
/**
*/
export enum WasmLanguage {
  English = 0,
  SimplifiedChinese = 1,
  TraditionalChinese = 2,
  Czech = 3,
  French = 4,
  Italian = 5,
  Japanese = 6,
  Korean = 7,
  Spanish = 8,
}
/**
*/
export enum WasmPaymentLinkKind {
  BitcoinAddress = 0,
  BitcoinURI = 1,
  LightningURI = 2,
  UnifiedURI = 3,
}
/**
*/
export enum WasmWordCount {
  Words12 = 0,
  Words15 = 1,
  Words18 = 2,
  Words21 = 3,
  Words24 = 4,
}
/**
*/
export enum WasmKeychainKind {
/**
* External keychain, used for deriving recipient addresses.
*/
  External = 0,
/**
* Internal keychain, used for deriving change addresses.
*/
  Internal = 1,
}

interface IWasmTransactionTime {
    confirmed: boolean;
    confirmation_time?: BigInt;
    last_seen?: BigInt;
}



interface IWasmDerivationPath {
    inner: {
        to_string: () => string
    }
}



interface IWasmSimpleTransaction {
    txid: string;
    value: BigInt;
    fees?: BigInt;
    time: IWasmTransactionTime,
    account_key?: IWasmDerivationPath,
}



type IWasmSimpleTransactionArray = IWasmSimpleTransaction[]



interface IWasmAddress {
    to_string: () => string
}



interface IWasmScript {
    to_address: () => IWasmAddress
}



enum IWasmKeychainKind {
    External, 
    Internal
}



type IWasmOutpoint = string



interface IWasmUtxo {
    value: BigInt;
    outpoint: IWasmOutpoint;
    script_pubkey: IWasmScript;
    keychain: IWasmKeychainKind;
    is_spent: boolean;
    derivation_index: BigInt;
    confirmation_time: IWasmTransactionTime;
}



type IWasmUtxoArray = IWasmUtxo[]


/**
*/
export class DetailledWasmError {
  free(): void;
/**
*/
  details: any;
/**
*/
  kind: WasmError;
}
/**
*/
export class WasmAccount {
  free(): void;
/**
* @returns {Promise<boolean>}
*/
  hasSyncData(): Promise<boolean>;
/**
* @param {number | undefined} [index]
* @param {bigint | undefined} [amount]
* @param {string | undefined} [label]
* @param {string | undefined} [message]
* @returns {Promise<WasmPaymentLink>}
*/
  getBitcoinUri(index?: number, amount?: bigint, label?: string, message?: string): Promise<WasmPaymentLink>;
/**
* @param {WasmAddress} address
* @returns {Promise<boolean>}
*/
  owns(address: WasmAddress): Promise<boolean>;
/**
* @returns {Promise<WasmBalance>}
*/
  getBalance(): Promise<WasmBalance>;
/**
* @returns {Promise<string>}
*/
  getDerivationPath(): Promise<string>;
/**
* @returns {Promise<IWasmUtxoArray>}
*/
  getUtxos(): Promise<IWasmUtxoArray>;
/**
* @param {WasmPagination | undefined} [pagination]
* @returns {Promise<IWasmSimpleTransactionArray>}
*/
  getTransactions(pagination?: WasmPagination): Promise<IWasmSimpleTransactionArray>;
/**
* @param {string} txid
* @returns {Promise<WasmDetailledTransaction>}
*/
  getTransaction(txid: string): Promise<WasmDetailledTransaction>;
}
/**
*/
export class WasmAccountConfig {
  free(): void;
/**
* @param {WasmSupportedBIPs | undefined} [bip]
* @param {WasmNetwork | undefined} [network]
* @param {number | undefined} [account_index]
*/
  constructor(bip?: WasmSupportedBIPs, network?: WasmNetwork, account_index?: number);
/**
*/
  account_index: number;
/**
*/
  bip: WasmSupportedBIPs;
/**
*/
  network: WasmNetwork;
}
/**
*/
export class WasmAddress {
  free(): void;
/**
* @param {string} str
* @param {WasmNetwork} network
*/
  constructor(str: string, network: WasmNetwork);
/**
* @param {WasmScript} value
* @param {WasmNetwork} network
* @returns {WasmAddress}
*/
  static fromScript(value: WasmScript, network: WasmNetwork): WasmAddress;
/**
* @returns {string}
*/
  toString(): string;
/**
* @returns {WasmScript}
*/
  intoScript(): WasmScript;
}
/**
*/
export class WasmAddressInfo {
  free(): void;
/**
* @returns {string}
*/
  to_string(): string;
/**
*/
  readonly index: number;
}
/**
*/
export class WasmBalance {
  free(): void;
/**
* Confirmed and immediately spendable balance
*/
  confirmed: bigint;
/**
* All coinbase outputs not yet matured
*/
  immature: bigint;
/**
* Unconfirmed UTXOs generated by a wallet tx
*/
  trusted_pending: bigint;
/**
* Unconfirmed UTXOs received from an external wallet
*/
  untrusted_pending: bigint;
}
/**
*/
export class WasmChain {
  free(): void;
/**
* Generates a Mnemonic with a random entropy based on the given word count.
*/
  constructor();
/**
* @returns {Promise<Map<string, number>>}
*/
  getFeesEstimation(): Promise<Map<string, number>>;
/**
* @param {WasmAccount} account
* @returns {Promise<void>}
*/
  fullSync(account: WasmAccount): Promise<void>;
/**
* @param {WasmAccount} account
* @returns {Promise<void>}
*/
  partialSync(account: WasmAccount): Promise<void>;
/**
* @param {WasmPartiallySignedTransaction} psbt
* @returns {Promise<string>}
*/
  broadcastPsbt(psbt: WasmPartiallySignedTransaction): Promise<string>;
}
/**
*/
export class WasmDerivationPath {
  free(): void;
/**
* @param {string} path
*/
  constructor(path: string);
/**
* @param {IWasmDerivationPath} raw_ts
* @returns {WasmDerivationPath}
*/
  static fromRawTs(raw_ts: IWasmDerivationPath): WasmDerivationPath;
}
/**
*/
export class WasmDetailledTransaction {
  free(): void;
/**
* @param {WasmPartiallySignedTransaction} psbt
* @param {WasmAccount} account
* @returns {Promise<WasmDetailledTransaction>}
*/
  static fromPsbt(psbt: WasmPartiallySignedTransaction, account: WasmAccount): Promise<WasmDetailledTransaction>;
/**
*/
  fees?: bigint;
/**
*/
  inputs: (WasmTxIn)[];
/**
*/
  outputs: (WasmTxOut)[];
/**
*/
  time?: WasmTransactionTime;
/**
*/
  txid: string;
/**
*/
  value: bigint;
}
/**
*/
export class WasmLockTime {
  free(): void;
/**
* @param {number} height
* @returns {WasmLockTime}
*/
  static fromHeight(height: number): WasmLockTime;
/**
* @param {number} seconds
* @returns {WasmLockTime}
*/
  static fromSeconds(seconds: number): WasmLockTime;
/**
* @returns {boolean}
*/
  isBlockHeight(): boolean;
/**
* @returns {boolean}
*/
  isBlockTime(): boolean;
/**
* @returns {number}
*/
  toConsensusU32(): number;
}
/**
*/
export class WasmMnemonic {
  free(): void;
/**
* Generates a Mnemonic with a random entropy based on the given word count.
* @param {WasmWordCount} word_count
*/
  constructor(word_count: WasmWordCount);
/**
* Parse a Mnemonic with the given string.
* @param {string} mnemonic
* @returns {WasmMnemonic}
*/
  static fromString(mnemonic: string): WasmMnemonic;
/**
* Returns the Mnemonic as a string.
* @returns {string}
*/
  asString(): string;
/**
* @returns {(string)[]}
*/
  toWords(): (string)[];
}
/**
*/
export class WasmOnchainPaymentLink {
  free(): void;
/**
*/
  address?: string;
/**
*/
  amount?: bigint;
/**
*/
  label?: string;
/**
*/
  message?: string;
}
/**
* Serialised Outpoint under the form <txid>:<index>
*/
export class WasmOutPoint {
  free(): void;
/**
* @param {IWasmOutpoint} raw_ts
* @returns {WasmOutPoint}
*/
  static fromRawTs(raw_ts: IWasmOutpoint): WasmOutPoint;
/**
*/
  0: string;
}
/**
*/
export class WasmPagination {
  free(): void;
/**
* @param {number} skip
* @param {number} take
*/
  constructor(skip: number, take: number);
/**
*/
  skip: number;
/**
*/
  take: number;
}
/**
*/
export class WasmPartiallySignedTransaction {
  free(): void;
/**
* @param {WasmAccount} wasm_account
* @param {WasmNetwork} network
* @returns {Promise<WasmPartiallySignedTransaction>}
*/
  sign(wasm_account: WasmAccount, network: WasmNetwork): Promise<WasmPartiallySignedTransaction>;
/**
*/
  recipients: (WasmPsbtRecipient)[];
/**
*/
  total_fees: bigint;
}
/**
*/
export class WasmPaymentLink {
  free(): void;
/**
* @returns {string}
*/
  toString(): string;
/**
* @returns {string}
*/
  toUri(): string;
/**
* @param {string} str
* @param {WasmNetwork} network
* @returns {WasmPaymentLink}
*/
  static tryParse(str: string, network: WasmNetwork): WasmPaymentLink;
/**
* @returns {WasmPaymentLinkKind}
*/
  getKind(): WasmPaymentLinkKind;
/**
* @returns {WasmOnchainPaymentLink}
*/
  assumeOnchain(): WasmOnchainPaymentLink;
}
/**
*/
export class WasmPsbtRecipient {
  free(): void;
/**
*/
  0: string;
/**
*/
  1: bigint;
}
/**
*/
export class WasmRecipient {
  free(): void;
/**
*/
  0: string;
/**
*/
  1: string;
/**
*/
  2: number;
/**
*/
  3: WasmBitcoinUnit;
}
/**
*/
export class WasmScript {
  free(): void;
/**
* @param {WasmNetwork} network
* @returns {WasmAddress}
*/
  toAddress(network: WasmNetwork): WasmAddress;
/**
*/
  0: Uint8Array;
}
/**
*/
export class WasmSequence {
  free(): void;
/**
*/
  0: number;
}
/**
*/
export class WasmSimpleTransaction {
  free(): void;
/**
*/
  account_key?: WasmDerivationPath;
/**
*/
  fees?: bigint;
/**
*/
  time: WasmTransactionTime;
/**
*/
  txid: string;
/**
*/
  value: bigint;
}
/**
*/
export class WasmTransactionTime {
  free(): void;
/**
*/
  confirmation_time?: bigint;
/**
*/
  confirmed: boolean;
/**
*/
  last_seen?: bigint;
}
/**
*/
export class WasmTxBuilder {
  free(): void;
/**
*/
  constructor();
/**
* @param {WasmAccount} account
* @returns {Promise<WasmTxBuilder>}
*/
  setAccount(account: WasmAccount): Promise<WasmTxBuilder>;
/**
* @returns {WasmTxBuilder}
*/
  clearRecipients(): WasmTxBuilder;
/**
* @returns {WasmTxBuilder}
*/
  addRecipient(): WasmTxBuilder;
/**
* @param {number} index
* @returns {WasmTxBuilder}
*/
  removeRecipient(index: number): WasmTxBuilder;
/**
* @param {number} index
* @param {string | undefined} [address_str]
* @param {number | undefined} [amount]
* @param {WasmBitcoinUnit | undefined} [unit]
* @returns {Promise<WasmTxBuilder>}
*/
  updateRecipient(index: number, address_str?: string, amount?: number, unit?: WasmBitcoinUnit): Promise<WasmTxBuilder>;
/**
* @param {number} index
* @returns {Promise<WasmTxBuilder>}
*/
  updateRecipientAmountToMax(index: number): Promise<WasmTxBuilder>;
/**
* @returns {(WasmRecipient)[]}
*/
  getRecipients(): (WasmRecipient)[];
/**
*
*     * UTXOs
*     
* @param {WasmOutPoint} outpoint
* @returns {WasmTxBuilder}
*/
  addUtxoToSpend(outpoint: WasmOutPoint): WasmTxBuilder;
/**
* @param {WasmOutPoint} outpoint
* @returns {WasmTxBuilder}
*/
  removeUtxoToSpend(outpoint: WasmOutPoint): WasmTxBuilder;
/**
* @returns {WasmTxBuilder}
*/
  clearUtxosToSpend(): WasmTxBuilder;
/**
* @returns {(WasmOutPoint)[]}
*/
  getUtxosToSpend(): (WasmOutPoint)[];
/**
*
*     * Coin selection enforcement
*     
* @param {WasmCoinSelection} coin_selection
* @returns {WasmTxBuilder}
*/
  setCoinSelection(coin_selection: WasmCoinSelection): WasmTxBuilder;
/**
* @returns {WasmCoinSelection}
*/
  getCoinSelection(): WasmCoinSelection;
/**
*
*     * RBF
*     
* @returns {WasmTxBuilder}
*/
  enableRbf(): WasmTxBuilder;
/**
* @returns {WasmTxBuilder}
*/
  disableRbf(): WasmTxBuilder;
/**
* @returns {boolean}
*/
  getRbfEnabled(): boolean;
/**
*
*     * Change policy
*     
* @param {WasmChangeSpendPolicy} change_policy
* @returns {WasmTxBuilder}
*/
  setChangePolicy(change_policy: WasmChangeSpendPolicy): WasmTxBuilder;
/**
* @returns {WasmChangeSpendPolicy}
*/
  getChangePolicy(): WasmChangeSpendPolicy;
/**
*
*     * Fees
*     
* @param {number} sat_per_vb
* @returns {Promise<WasmTxBuilder>}
*/
  setFeeRate(sat_per_vb: number): Promise<WasmTxBuilder>;
/**
* @returns {number | undefined}
*/
  getFeeRate(): number | undefined;
/**
*
*     * Locktime
*     
* @param {WasmLockTime} locktime
* @returns {WasmTxBuilder}
*/
  addLocktime(locktime: WasmLockTime): WasmTxBuilder;
/**
* @returns {WasmTxBuilder}
*/
  removeLocktime(): WasmTxBuilder;
/**
* @returns {WasmLockTime | undefined}
*/
  getLocktime(): WasmLockTime | undefined;
/**
*
*     * Final
*     
* @param {WasmNetwork} network
* @returns {Promise<WasmPartiallySignedTransaction>}
*/
  createPsbt(network: WasmNetwork): Promise<WasmPartiallySignedTransaction>;
}
/**
*/
export class WasmTxIn {
  free(): void;
/**
*/
  previous_output: WasmOutPoint;
/**
*/
  script_sig: WasmScript;
/**
*/
  sequence: WasmSequence;
}
/**
*/
export class WasmTxOut {
  free(): void;
/**
*/
  address: WasmAddress;
/**
*/
  is_mine: boolean;
/**
*/
  script_pubkey: WasmScript;
/**
*/
  value: bigint;
}
/**
*/
export class WasmUtxo {
  free(): void;
/**
*/
  confirmation_time: WasmTransactionTime;
/**
*/
  derivation_index: number;
/**
*/
  is_spent: boolean;
/**
*/
  keychain: WasmKeychainKind;
/**
*/
  outpoint: WasmOutPoint;
/**
*/
  script_pubkey: WasmScript;
/**
*/
  value: bigint;
}
/**
*/
export class WasmWallet {
  free(): void;
/**
* @param {string} bip39_mnemonic
* @param {string | undefined} bip38_passphrase
* @param {WasmWalletConfig} config
*/
  constructor(bip39_mnemonic: string, bip38_passphrase: string | undefined, config: WasmWalletConfig);
/**
* @param {WasmSupportedBIPs} bip
* @param {number} account_index
* @returns {WasmDerivationPath}
*/
  addAccount(bip: WasmSupportedBIPs, account_index: number): WasmDerivationPath;
/**
* @param {WasmDerivationPath} account_key
* @returns {WasmAccount | undefined}
*/
  getAccount(account_key: WasmDerivationPath): WasmAccount | undefined;
/**
* @returns {Promise<WasmBalance>}
*/
  getBalance(): Promise<WasmBalance>;
/**
* @param {WasmPagination | undefined} [pagination]
* @returns {Promise<IWasmSimpleTransactionArray>}
*/
  getTransactions(pagination?: WasmPagination): Promise<IWasmSimpleTransactionArray>;
/**
* @param {WasmDerivationPath} account_key
* @param {string} txid
* @returns {Promise<WasmDetailledTransaction>}
*/
  getTransaction(account_key: WasmDerivationPath, txid: string): Promise<WasmDetailledTransaction>;
/**
* @returns {string}
*/
  getFingerprint(): string;
}
/**
*/
export class WasmWalletConfig {
  free(): void;
/**
* @param {WasmNetwork | undefined} [network]
* @param {boolean | undefined} [no_persist]
*/
  constructor(network?: WasmNetwork, no_persist?: boolean);
/**
*/
  network: WasmNetwork;
/**
*/
  no_persist: boolean;
}

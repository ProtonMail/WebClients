/* tslint:disable */
/* eslint-disable */
/**
*/
export function setPanicHook(): void;
/**
* @returns {Promise<WasmNetwork>}
*/
export function getNetwork(): Promise<WasmNetwork>;
/**
* @param {string} word_start
* @returns {(string)[]}
*/
export function getWordsAutocomplete(word_start: string): (string)[];
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
export enum WasmChangeSpendPolicy {
  ChangeAllowed = 0,
  OnlyChange = 1,
  ChangeForbidden = 2,
}
/**
*/
export enum WasmError {
  AccountNotFound = 0,
  BdkError = 1,
  Bip32Error = 2,
  Bip39Error = 3,
  CannotBroadcastTransaction = 4,
  CannotComputeTxFees = 5,
  CannotGetFeeEstimation = 6,
  CannotGetLocalStorage = 7,
  CannotCreateAddressFromScript = 8,
  CannotFindPersistedData = 9,
  CannotGetAddressFromScript = 10,
  CannotSignPsbt = 11,
  DerivationError = 12,
  DescriptorError = 13,
  InvalidAccountIndex = 14,
  InvalidAddress = 15,
  InvalidData = 16,
  InvalidDescriptor = 17,
  InvalidDerivationPath = 18,
  InvalidNetwork = 19,
  InvalidTxId = 20,
  InvalidScriptType = 21,
  InvalidSecretKey = 22,
  InvalidMnemonic = 23,
  LoadError = 24,
  NoWindowContext = 25,
  OutpointParsingError = 26,
  SyncError = 27,
  TransactionNotFound = 28,
}
/**
*/
export enum WasmScriptType {
  Legacy = 0,
  NestedSegwit = 1,
  NativeSegwit = 2,
  Taproot = 3,
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

interface IWasmBlockTime {
    height: BigInt,
    timestamp: BigInt,
}



interface IWasmDerivationPath {
    inner: {
        to_string: () => string
    }
}



interface IWasmSimpleTransaction {
    txid: string;
    sent: BigInt;
    received: BigInt;
    fees?: BigInt;
    confirmation_time?: IWasmBlockTime
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
export class SerialisableDatabase {
  free(): void;
}
/**
*/
export class WasmAccount {
  free(): void;
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
* @returns {Promise<WasmTransactionDetails>}
*/
  getTransaction(txid: string): Promise<WasmTransactionDetails>;
}
/**
*/
export class WasmAccountConfig {
  free(): void;
/**
* @param {WasmScriptType} script_type
* @param {WasmNetwork | undefined} [network]
* @param {number | undefined} [account_index]
*/
  constructor(script_type: WasmScriptType, network?: WasmNetwork, account_index?: number);
/**
*/
  account_index: number;
/**
*/
  network: WasmNetwork;
/**
*/
  script_type: WasmScriptType;
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
export class WasmBlockTime {
  free(): void;
/**
*/
  height: number;
/**
*/
  timestamp: bigint;
}
/**
*/
export class WasmBlockchain {
  free(): void;
/**
* @param {string | undefined} [url]
* @param {number | undefined} [stop_gap]
*/
  constructor(url?: string, stop_gap?: number);
/**
* Perform a full sync for the account
* @param {WasmAccount} account
* @returns {Promise<void>}
*/
  fullSync(account: WasmAccount): Promise<void>;
/**
* Start a syncing loop
* @param {WasmAccount} account
* @returns {Promise<void>}
*/
  startSyncLoop(account: WasmAccount): Promise<void>;
/**
* Stop the syncing loop
* @param {WasmAccount} account
* @returns {Promise<void>}
*/
  stopSyncLoop(account: WasmAccount): Promise<void>;
/**
* Returns fee estimations in a Map
* @returns {Promise<Map<string, number>>}
*/
  getFeesEstimation(): Promise<Map<string, number>>;
/**
* Broadcasts a provided transaction
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
  asWords(): (string)[];
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
  confirmation_time?: WasmBlockTime;
/**
*/
  fees?: bigint;
/**
*/
  received: bigint;
/**
*/
  sent: bigint;
/**
*/
  txid: string;
}
/**
*/
export class WasmTransactionDetails {
  free(): void;
/**
* @param {WasmPartiallySignedTransaction} psbt
* @param {WasmAccount} account
* @returns {Promise<WasmTransactionDetails>}
*/
  static fromPsbt(psbt: WasmPartiallySignedTransaction, account: WasmAccount): Promise<WasmTransactionDetails>;
/**
*/
  confirmation_time?: WasmBlockTime;
/**
*/
  fee?: bigint;
/**
*/
  inputs: (WasmTxIn)[];
/**
*/
  outputs: (WasmTxOut)[];
/**
*/
  received: bigint;
/**
*/
  sent: bigint;
/**
*/
  txid: string;
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
* @param {WasmNetwork} network
* @param {string} bip39_mnemonic
* @param {string | undefined} [bip38_passphrase]
* @param {([WasmScriptType, number])[] | undefined} [accounts]
*/
  constructor(network: WasmNetwork, bip39_mnemonic: string, bip38_passphrase?: string, accounts?: ([WasmScriptType, number])[]);
/**
* @param {WasmScriptType} script_type
* @param {number} account_index
* @returns {WasmDerivationPath}
*/
  addAccount(script_type: WasmScriptType, account_index: number): WasmDerivationPath;
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
* @returns {Promise<WasmTransactionDetails>}
*/
  getTransaction(account_key: WasmDerivationPath, txid: string): Promise<WasmTransactionDetails>;
/**
* @returns {string}
*/
  getFingerprint(): string;
}

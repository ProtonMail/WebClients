/* tslint:disable */
/* eslint-disable */
/**
* @param {string} word_start
* @returns {(string)[]}
*/
export function getWordsAutocomplete(word_start: string): (string)[];
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
export enum WasmChangeSpendPolicy {
  ChangeAllowed = 0,
  OnlyChange = 1,
  ChangeForbidden = 2,
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
export enum WasmCoinSelection {
  BranchAndBound = 0,
  LargestFirst = 1,
  OldestFirst = 2,
  Manual = 3,
}
/**
*/
export enum WasmFiatCurrency {
  USD = 0,
  EUR = 1,
  CHF = 2,
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
export enum WasmError {
  AccountNotFound = 0,
  ApiError = 1,
  BdkError = 2,
  Bip32Error = 3,
  Bip39Error = 4,
  CannotBroadcastTransaction = 5,
  CannotComputeTxFees = 6,
  CannotGetFeeEstimation = 7,
  CannotCreateAddressFromScript = 8,
  CannotGetAddressFromScript = 9,
  CannotSignPsbt = 10,
  DerivationError = 11,
  DescriptorError = 12,
  InvalidAccountIndex = 13,
  InvalidAddress = 14,
  InvalidData = 15,
  InvalidDescriptor = 16,
  InvalidDerivationPath = 17,
  InvalidNetwork = 18,
  InvalidTxId = 19,
  InvalidScriptType = 20,
  InvalidSecretKey = 21,
  InvalidMnemonic = 22,
  LoadError = 23,
  OutpointParsingError = 24,
  SyncError = 25,
  TransactionNotFound = 26,
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
export interface WasmApiWallet {
    ID: string;
    Name: string;
    IsImported: number;
    Priority: number;
    Type: number;
    HasPassphrase: number;
    Status: number;
    Mnemonic: string | null;
    Fingerprint: string | null;
    PublicKey: string | null;
}

export interface WasmWalletKey {
    UserKeyID: string;
    WalletKey: string;
}

export interface WasmWalletSettings {
    HideAccounts: number;
    InvoiceDefaultDescription: string | null;
    InvoiceExpirationTime: number;
    MaxChannelOpeningFee: number;
}

export interface WasmWalletAccount {
    ID: string;
    DerivationPath: string;
    Label: string;
    ScriptType: number;
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
export class WasmAccount {
  free(): void;
/**
* @param {number | undefined} [index]
* @param {bigint | undefined} [amount]
* @param {string | undefined} [label]
* @param {string | undefined} [message]
* @returns {WasmPaymentLink}
*/
  getBitcoinUri(index?: number, amount?: bigint, label?: string, message?: string): WasmPaymentLink;
/**
* @param {WasmAddress} address
* @returns {boolean}
*/
  owns(address: WasmAddress): boolean;
/**
* @returns {WasmBalance}
*/
  getBalance(): WasmBalance;
/**
* @returns {string}
*/
  getDerivationPath(): string;
/**
* @returns {IWasmUtxoArray}
*/
  getUtxos(): IWasmUtxoArray;
/**
* @param {WasmPagination | undefined} [pagination]
* @returns {IWasmSimpleTransactionArray}
*/
  getTransactions(pagination?: WasmPagination): IWasmSimpleTransactionArray;
/**
* @param {string} txid
* @returns {WasmTransactionDetails}
*/
  getTransaction(txid: string): WasmTransactionDetails;
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
export class WasmAuthData {
  free(): void;
/**
* @param {string} uid
* @param {string} access
* @param {string} refresh
* @param {(string)[]} scopes
*/
  constructor(uid: string, access: string, refresh: string, scopes: (string)[]);
/**
*/
  access: string;
/**
*/
  refresh: string;
/**
*/
  scopes: (string)[];
/**
*/
  uid: string;
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
/**
* @param {number} purpose
* @param {WasmNetwork} network
* @param {number} account_index
* @returns {WasmDerivationPath}
*/
  static fromParts(purpose: number, network: WasmNetwork, account_index: number): WasmDerivationPath;
/**
* @param {string} str
* @returns {WasmDerivationPath}
*/
  static fromString(str: string): WasmDerivationPath;
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
* Generates a Mnemonic with a random entropy based on the given word
* count.
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
export class WasmNetworkClient {
  free(): void;
/**
* @returns {Promise<WasmNetwork>}
*/
  getNetwork(): Promise<WasmNetwork>;
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
* @returns {WasmPartiallySignedTransaction}
*/
  sign(wasm_account: WasmAccount, network: WasmNetwork): WasmPartiallySignedTransaction;
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
export class WasmProtonWalletApiClient {
  free(): void;
/**
* @param {WasmAuthData | undefined} [auth]
*/
  constructor(auth?: WasmAuthData);
/**
* @returns {Promise<void>}
*/
  login(): Promise<void>;
/**
* Returns a client to use settings API
* @returns {WasmSettingsClient}
*/
  settings(): WasmSettingsClient;
/**
* Returns a client to use network API
* @returns {WasmNetworkClient}
*/
  network(): WasmNetworkClient;
/**
* Returns a client to use wallet API
* @returns {WasmWalletClient}
*/
  wallet(): WasmWalletClient;
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
export class WasmSettingsClient {
  free(): void;
/**
* @returns {Promise<WasmUserSettings>}
*/
  getUserSettings(): Promise<WasmUserSettings>;
/**
* @param {WasmBitcoinUnit} symbol
* @returns {Promise<WasmUserSettings>}
*/
  setBitcoinUnit(symbol: WasmBitcoinUnit): Promise<WasmUserSettings>;
/**
* @param {WasmFiatCurrency} symbol
* @returns {Promise<WasmUserSettings>}
*/
  setFiatCurrency(symbol: WasmFiatCurrency): Promise<WasmUserSettings>;
/**
* @param {bigint} amount
* @returns {Promise<WasmUserSettings>}
*/
  setTwoFaThreshold(amount: bigint): Promise<WasmUserSettings>;
/**
* @param {boolean} hide_empty_used_addresses
* @returns {Promise<WasmUserSettings>}
*/
  setHideEmptyUsedAddresses(hide_empty_used_addresses: boolean): Promise<WasmUserSettings>;
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
export class WasmUserSettings {
  free(): void;
/**
*/
  BitcoinUnit: WasmBitcoinUnit;
/**
*/
  FiatCurrency: WasmFiatCurrency;
/**
*/
  HideEmptyUsedAddresses: number;
/**
*/
  ShowWalletRecovery: number;
/**
*/
  TwoFactorAmountThreshold?: bigint;
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
* @param {([WasmScriptType, WasmDerivationPath])[] | undefined} [accounts]
*/
  constructor(network: WasmNetwork, bip39_mnemonic: string, bip38_passphrase?: string, accounts?: ([WasmScriptType, WasmDerivationPath])[]);
/**
* @param {WasmScriptType} script_type
* @param {WasmDerivationPath} derivation_path
* @returns {WasmDerivationPath}
*/
  addAccount(script_type: WasmScriptType, derivation_path: WasmDerivationPath): WasmDerivationPath;
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
/**
*/
export class WasmWalletAccountArray {
  free(): void;
/**
*/
  0: (WasmWalletAccountData)[];
}
/**
*/
export class WasmWalletAccountData {
  free(): void;
/**
*/
  Account: WasmWalletAccount;
}
/**
*/
export class WasmWalletClient {
  free(): void;
/**
* @returns {Promise<WasmWalletDataArray>}
*/
  getWallets(): Promise<WasmWalletDataArray>;
/**
* @param {string} name
* @param {boolean} is_imported
* @param {number} wallet_type
* @param {boolean} has_passphrase
* @param {string} user_key_id
* @param {string} wallet_key
* @param {string | undefined} [mnemonic]
* @param {string | undefined} [fingerprint]
* @param {string | undefined} [public_key]
* @returns {Promise<WasmWalletData>}
*/
  createWallet(name: string, is_imported: boolean, wallet_type: number, has_passphrase: boolean, user_key_id: string, wallet_key: string, mnemonic?: string, fingerprint?: string, public_key?: string): Promise<WasmWalletData>;
/**
* @param {string} wallet_id
* @returns {Promise<void>}
*/
  deleteWallet(wallet_id: string): Promise<void>;
/**
* @param {string} wallet_id
* @returns {Promise<WasmWalletAccountArray>}
*/
  getWalletAccounts(wallet_id: string): Promise<WasmWalletAccountArray>;
/**
* @param {string} wallet_id
* @param {WasmDerivationPath} derivation_path
* @param {string} label
* @param {number} script_type
* @returns {Promise<WasmWalletAccountData>}
*/
  createWalletAccount(wallet_id: string, derivation_path: WasmDerivationPath, label: string, script_type: number): Promise<WasmWalletAccountData>;
/**
* @param {string} wallet_id
* @param {string} wallet_account_id
* @param {string} label
* @returns {Promise<WasmWalletAccountData>}
*/
  updateWalletAccountLabel(wallet_id: string, wallet_account_id: string, label: string): Promise<WasmWalletAccountData>;
/**
* @param {string} wallet_id
* @param {string} wallet_account_id
* @returns {Promise<void>}
*/
  deleteWalletAccount(wallet_id: string, wallet_account_id: string): Promise<void>;
/**
* @param {string} wallet_id
* @returns {Promise<WasmWalletTransactionArray>}
*/
  getWalletTransactions(wallet_id: string): Promise<WasmWalletTransactionArray>;
/**
* @param {string} wallet_id
* @param {string} label
* @param {string} txid
* @returns {Promise<WasmWalletTransaction>}
*/
  createWalletTransaction(wallet_id: string, label: string, txid: string): Promise<WasmWalletTransaction>;
/**
* @param {string} wallet_id
* @param {string} wallet_transaction_id
* @param {string} label
* @returns {Promise<WasmWalletTransaction>}
*/
  updateWalletTransactionLabel(wallet_id: string, wallet_transaction_id: string, label: string): Promise<WasmWalletTransaction>;
/**
* @param {string} wallet_id
* @param {string} wallet_transaction_id
* @returns {Promise<void>}
*/
  deleteWalletTransaction(wallet_id: string, wallet_transaction_id: string): Promise<void>;
}
/**
*/
export class WasmWalletData {
  free(): void;
/**
* @param {WasmApiWallet} wallet
* @param {WasmWalletKey} key
* @param {WasmWalletSettings} settings
* @returns {WasmWalletData}
*/
  static from_parts(wallet: WasmApiWallet, key: WasmWalletKey, settings: WasmWalletSettings): WasmWalletData;
/**
*/
  Wallet: WasmApiWallet;
/**
*/
  WalletKey: WasmWalletKey;
/**
*/
  WalletSettings: WasmWalletSettings;
}
/**
*/
export class WasmWalletDataArray {
  free(): void;
/**
*/
  0: (WasmWalletData)[];
}
/**
*/
export class WasmWalletTransaction {
  free(): void;
/**
*/
  ID: string;
/**
*/
  Label: string;
/**
*/
  TransactionID: string;
/**
*/
  WalletID: string;
}
/**
*/
export class WasmWalletTransactionArray {
  free(): void;
/**
*/
  0: (WasmWalletTransaction)[];
}

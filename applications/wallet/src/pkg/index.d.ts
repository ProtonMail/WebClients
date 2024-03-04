/* tslint:disable */
/* eslint-disable */
/**
*/
export function setPanicHook(): void;
/**
* @param {string} word_start
* @returns {(string)[]}
*/
export function getWordsAutocomplete(word_start: string): (string)[];
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
export enum WasmBitcoinUnit {
  BTC = 0,
  MBTC = 1,
  SAT = 2,
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
export enum WasmChangeSpendPolicy {
  ChangeAllowed = 0,
  OnlyChange = 1,
  ChangeForbidden = 2,
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
export enum WasmError {
  AccountNotFound = 0,
  ApiError = 1,
  AddUtxoError = 2,
  BdkError = 3,
  Bip32Error = 4,
  Bip39Error = 5,
  CannotBroadcastTransaction = 6,
  CannotComputeTxFees = 7,
  CannotGetFeeEstimation = 8,
  CannotCreateAddressFromScript = 9,
  CannotFindPersistedData = 10,
  CannotGetAddressFromScript = 11,
  CannotGetLocalStorage = 12,
  CannotParsePersistedData = 13,
  CannotPersistData = 14,
  CannotSerializePersistedData = 15,
  CannotSignPsbt = 16,
  CreateTxError = 17,
  DerivationError = 18,
  DescriptorError = 19,
  InvalidAccountIndex = 20,
  InvalidAddress = 21,
  InvalidData = 22,
  InvalidDescriptor = 23,
  InvalidDerivationPath = 24,
  InvalidNetwork = 25,
  InvalidTxId = 26,
  InvalidScriptType = 27,
  InvalidSecretKey = 28,
  InvalidMnemonic = 29,
  LoadError = 30,
  NewWalletError = 31,
  NoWindowContext = 32,
  OutpointParsingError = 33,
  SignerError = 34,
  SyncError = 35,
  TransactionNotFound = 36,
  WriteError = 37,
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
export enum WasmScriptType {
  Legacy = 0,
  NestedSegwit = 1,
  NativeSegwit = 2,
  Taproot = 3,
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

export interface WasmApiWalletKey {
    WalletID: string;
    UserKeyID: string;
    WalletKey: string;
}

export interface WasmApiWalletSettings {
    WalletID: string;
    HideAccounts: number;
    InvoiceDefaultDescription: string | null;
    InvoiceExpirationTime: number;
    MaxChannelOpeningFee: number;
}

export interface WasmApiWalletAccount {
    WalletID: string;
    ID: string;
    DerivationPath: string;
    Label: string;
    ScriptType: number;
}

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
* @returns {WasmUtxoArray}
*/
  getUtxos(): WasmUtxoArray;
/**
* @param {WasmPagination | undefined} [pagination]
* @returns {WasmTransactionDetailsArray}
*/
  getTransactions(pagination?: WasmPagination): WasmTransactionDetailsArray;
/**
* @param {string} txid
* @returns {WasmTransactionDetails}
*/
  getTransaction(txid: string): WasmTransactionDetails;
/**
* @returns {boolean}
*/
  hasSyncData(): boolean;
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
export class WasmApiWalletAccounts {
  free(): void;
/**
*/
  0: (WasmWalletAccountData)[];
}
/**
*/
export class WasmApiWalletData {
  free(): void;
/**
* @param {WasmApiWallet} wallet
* @param {WasmApiWalletKey} key
* @param {WasmApiWalletSettings} settings
* @returns {WasmApiWalletData}
*/
  static from_parts(wallet: WasmApiWallet, key: WasmApiWalletKey, settings: WasmApiWalletSettings): WasmApiWalletData;
/**
*/
  Wallet: WasmApiWallet;
/**
*/
  WalletKey: WasmApiWalletKey;
/**
*/
  WalletSettings: WasmApiWalletSettings;
}
/**
*/
export class WasmApiWalletTransaction {
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
export class WasmApiWalletTransactions {
  free(): void;
/**
*/
  0: (WasmApiWalletTransaction)[];
}
/**
*/
export class WasmApiWalletsData {
  free(): void;
/**
*/
  0: (WasmApiWalletData)[];
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
export class WasmBlockchainClient {
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
* @param {WasmAccount} account
* @returns {Promise<boolean>}
*/
  shouldSync(account: WasmAccount): Promise<boolean>;
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
* @param {string} str
* @returns {WasmOutPoint}
*/
  static fromString(str: string): WasmOutPoint;
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
  time?: WasmTransactionTime;
/**
*/
  txid: string;
}
/**
*/
export class WasmTransactionDetailsArray {
  free(): void;
/**
*/
  0: (WasmTransactionDetails)[];
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
export class WasmUtxoArray {
  free(): void;
/**
*/
  0: (WasmUtxo)[];
}
/**
*/
export class WasmWallet {
  free(): void;
/**
* @param {WasmNetwork} network
* @param {string} bip39_mnemonic
* @param {string | undefined} [bip38_passphrase]
* @param {([u8, String])[] | undefined} [accounts]
*/
  constructor(network: WasmNetwork, bip39_mnemonic: string, bip38_passphrase?: string, accounts?: ([u8, String])[]);
/**
* @param {number} script_type
* @param {string} derivation_path
* @returns {WasmDerivationPath}
*/
  addAccount(script_type: number, derivation_path: string): WasmDerivationPath;
/**
* @param {string} derivation_path
* @returns {WasmAccount | undefined}
*/
  getAccount(derivation_path: string): WasmAccount | undefined;
/**
* @returns {Promise<WasmBalance>}
*/
  getBalance(): Promise<WasmBalance>;
/**
* @param {WasmPagination | undefined} [pagination]
* @returns {Promise<WasmTransactionDetailsArray>}
*/
  getTransactions(pagination?: WasmPagination): Promise<WasmTransactionDetailsArray>;
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
export class WasmWalletAccountData {
  free(): void;
/**
*/
  Account: WasmApiWalletAccount;
}
/**
*/
export class WasmWalletClient {
  free(): void;
/**
* @returns {Promise<WasmApiWalletsData>}
*/
  getWallets(): Promise<WasmApiWalletsData>;
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
* @returns {Promise<WasmApiWalletData>}
*/
  createWallet(name: string, is_imported: boolean, wallet_type: number, has_passphrase: boolean, user_key_id: string, wallet_key: string, mnemonic?: string, fingerprint?: string, public_key?: string): Promise<WasmApiWalletData>;
/**
* @param {string} wallet_id
* @returns {Promise<void>}
*/
  deleteWallet(wallet_id: string): Promise<void>;
/**
* @param {string} wallet_id
* @returns {Promise<WasmApiWalletAccounts>}
*/
  getWalletAccounts(wallet_id: string): Promise<WasmApiWalletAccounts>;
/**
* @param {string} wallet_id
* @param {WasmDerivationPath} derivation_path
* @param {string} label
* @param {WasmScriptType} script_type
* @returns {Promise<WasmWalletAccountData>}
*/
  createWalletAccount(wallet_id: string, derivation_path: WasmDerivationPath, label: string, script_type: WasmScriptType): Promise<WasmWalletAccountData>;
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
* @returns {Promise<WasmApiWalletTransactions>}
*/
  getWalletTransactions(wallet_id: string): Promise<WasmApiWalletTransactions>;
/**
* @param {string} wallet_id
* @param {string} label
* @param {string} txid
* @returns {Promise<WasmApiWalletTransaction>}
*/
  createWalletTransaction(wallet_id: string, label: string, txid: string): Promise<WasmApiWalletTransaction>;
/**
* @param {string} wallet_id
* @param {string} wallet_transaction_id
* @param {string} label
* @returns {Promise<WasmApiWalletTransaction>}
*/
  updateWalletTransactionLabel(wallet_id: string, wallet_transaction_id: string, label: string): Promise<WasmApiWalletTransaction>;
/**
* @param {string} wallet_id
* @param {string} wallet_transaction_id
* @returns {Promise<void>}
*/
  deleteWalletTransaction(wallet_id: string, wallet_transaction_id: string): Promise<void>;
}

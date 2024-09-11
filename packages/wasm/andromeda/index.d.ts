/* tslint:disable */
/* eslint-disable */
/**
* @param {WasmPsbt} psbt
* @param {WasmAccount} account
* @returns {Promise<WasmTransactionDetailsData>}
*/
export function createTransactionFromPsbt(psbt: WasmPsbt, account: WasmAccount): Promise<WasmTransactionDetailsData>;
/**
* @returns {number}
*/
export function getDefaultStopGap(): number;
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
export enum WasmCoinSelection {
  BranchAndBound = 0,
  LargestFirst = 1,
  OldestFirst = 2,
  Manual = 3,
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
export enum WasmSortOrder {
  Asc = 0,
  Desc = 1,
}
/**
*/
export enum WasmScriptType {
  Legacy = 1,
  NestedSegwit = 2,
  NativeSegwit = 3,
  Taproot = 4,
}
/**
*/
export enum WasmWalletTransactionFlag {
  Suspicious = 0,
  Private = 1,
}
/**
*/
export enum WasmPaymentLinkKind {
  BitcoinAddress = 0,
  BitcoinURI = 1,
  LightningURI = 2,
  UnifiedURI = 3,
}
export type WasmInviteNotificationType = "Newcomer" | "EmailIntegration" | "Unsupported";

export type WasmUserReceiveNotificationEmailTypes = "NotificationToInviter" | "EmailIntegration" | "TransactionalBvE" | "Unsupported";

export type WasmFiatCurrencySymbol = "ALL" | "DZD" | "ARS" | "AMD" | "AUD" | "AZN" | "BHD" | "BDT" | "BYN" | "BMD" | "BOB" | "BAM" | "BRL" | "BGN" | "KHR" | "CAD" | "CLP" | "CNY" | "COP" | "CRC" | "HRK" | "CUP" | "CZK" | "DKK" | "DOP" | "EGP" | "EUR" | "GEL" | "GHS" | "GTQ" | "HNL" | "HKD" | "HUF" | "ISK" | "INR" | "IDR" | "IRR" | "IQD" | "ILS" | "JMD" | "JPY" | "JOD" | "KZT" | "KES" | "KWD" | "KGS" | "LBP" | "MKD" | "MYR" | "MUR" | "MXN" | "MDL" | "MNT" | "MAD" | "MMK" | "NAD" | "NPR" | "TWD" | "NZD" | "NIO" | "NGN" | "NOK" | "OMR" | "PKR" | "PAB" | "PEN" | "PHP" | "PLN" | "GBP" | "QAR" | "RON" | "RUB" | "SAR" | "RSD" | "SGD" | "ZAR" | "KRW" | "SSP" | "VES" | "LKR" | "SEK" | "CHF" | "THB" | "TTD" | "TND" | "TRY" | "UGX" | "UAH" | "AED" | "USD" | "UYU" | "UZS" | "VND";

export interface WasmUserSettings {
    BitcoinUnit: WasmBitcoinUnit;
    FiatCurrency: WasmFiatCurrencySymbol;
    HideEmptyUsedAddresses: number;
    TwoFactorAmountThreshold: number | null;
    ReceiveInviterNotification: number | null;
    ReceiveEmailIntegrationNotification: number | null;
    WalletCreated: number | null;
    AcceptTermsAndConditions: number | null;
}

export interface WasmApiWalletBitcoinAddressLookup {
    BitcoinAddress: string | null;
    BitcoinAddressSignature: string | null;
}

export interface WasmApiWalletBitcoinAddress {
    ID: string;
    WalletID: string;
    WalletAccountID: string;
    Fetched: number;
    Used: number;
    BitcoinAddress: string | null;
    BitcoinAddressSignature: string | null;
    BitcoinAddressIndex: number | null;
}

export interface WasmApiBitcoinAddressCreationPayload {
    BitcoinAddress: string;
    BitcoinAddressSignature: string;
    BitcoinAddressIndex: number;
}

export type WasmGatewayProvider = "Banxa" | "Ramp" | "MoonPay" | "Unsupported";

export interface WasmApiCountry {
    Code: string;
    FiatCurrency: string;
    Name: string;
}

export interface WasmCountries {
    data: WasmApiCountry[];
}

export interface WasmApiSimpleFiatCurrency {
    Symbol: string;
    Name: string;
    MinimumAmount: string | null;
}

export interface WasmFiatCurrencies {
    data: WasmApiSimpleFiatCurrency[];
}

export type WasmPaymentMethod = "ApplePay" | "BankTransfer" | "Card" | "GooglePay" | "InstantPayment" | "Paypal" | "Unsupported";

export interface WasmPaymentMethods {
    data: WasmPaymentMethod[];
}

export interface WasmQuote {
    BitcoinAmount: string;
    FiatAmount: string;
    FiatCurrencySymbol: string;
    NetworkFee: string;
    PaymentGatewayFee: string;
    PaymentMethod: WasmPaymentMethod;
}

export interface WasmQuotes {
    data: WasmQuote[];
}

export interface WasmTxOut {
    value: number;
    script_pubkey: WasmScript;
    is_mine: boolean;
    address: string;
}

export interface WasmTransactionDetails {
    txid: string;
    received: number;
    sent: number;
    fee: number | null;
    time: WasmTransactionTime;
    inputs: WasmDetailledTxIn[];
    outputs: WasmTxOut[];
    account_derivation_path: string;
}

export interface WasmTransactionTime {
    confirmed: boolean;
    confirmation_time: number | null;
    last_seen: number | null;
}

export type WasmExchangeRateOrTransactionTimeEnum = "ExchangeRate" | "TransactionTime";

export interface WasmExchangeRateOrTransactionTime {
    key: WasmExchangeRateOrTransactionTimeEnum;
    value: string;
}

export interface WasmTransactionData {
    label: string | null;
    exchange_rate_or_transaction_time: WasmExchangeRateOrTransactionTime;
}

export interface WasmEmailIntegrationData {
    address_id: string | null;
    body: string | null;
    recipients: Record<string, string> | null;
    is_anonymous: number | null;
}

export interface WasmAddressInfo {
    index: number;
    address: string;
    keychain: WasmKeychainKind;
}

export interface WasmPagination {
    skip: number;
    take: number;
}

export type WasmBitcoinUnit = "BTC" | "MBTC" | "SATS";

export interface WasmApiWalletBitcoinAddressLookup {
    BitcoinAddress: string | null;
    BitcoinAddressSignature: string | null;
}

export interface WasmApiExchangeRate {
    ID: string;
    BitcoinUnit: WasmBitcoinUnit;
    FiatCurrency: WasmFiatCurrencySymbol;
    ExchangeRateTime: string;
    ExchangeRate: number;
    Cents: number;
}

export interface WasmApiFiatCurrency {
    ID: string;
    Name: string;
    Symbol: WasmFiatCurrencySymbol;
    Sign: string;
    Cents: number;
}

export type WasmTimeframe = "OneDay" | "OneWeek" | "OneMonth" | "Unsupported";

export interface WasmDataPoint {
    ExchangeRate: number;
    Cents: number;
    Timestamp: number;
}

export interface WasmPriceGraph {
    FiatCurrency: WasmFiatCurrencySymbol;
    BitcoinUnit: WasmBitcoinUnit;
    GraphData: WasmDataPoint[];
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
    MigrationRequired: number | null;
}

export interface WasmApiWalletKey {
    WalletID: string;
    UserKeyID: string;
    WalletKey: string;
    WalletKeySignature: string;
}

export interface WasmApiWalletSettings {
    WalletID: string;
    HideAccounts: number;
    InvoiceDefaultDescription: string | null;
    InvoiceExpirationTime: number;
    MaxChannelOpeningFee: number;
    ShowWalletRecovery: boolean | null;
}

export interface WasmApiEmailAddress {
    ID: string;
    Email: string;
}

export interface WasmApiWalletAccount {
    WalletID: string;
    FiatCurrency: WasmFiatCurrencySymbol;
    ID: string;
    DerivationPath: string;
    Label: string;
    LastUsedIndex: number;
    PoolSize: number;
    Priority: number;
    ScriptType: number;
    Addresses: WasmApiEmailAddress[];
}

export type WasmTransactionType = "NotSend" | "ProtonToProtonSend" | "ProtonToProtonReceive" | "ExternalSend" | "ExternalReceive" | "Unsupported";

export interface WasmApiWalletTransaction {
    ID: string;
    Type: WasmTransactionType | null;
    WalletID: string;
    WalletAccountID: string | null;
    Label: string | null;
    TransactionID: string;
    TransactionTime: string;
    IsSuspicious: number;
    IsPrivate: number;
    ExchangeRate: WasmApiExchangeRate | null;
    HashedTransactionID: string | null;
    Subject: string | null;
    Body: string | null;
    ToList: string | null;
    Sender: string | null;
}

export interface WasmCreateWalletTransactionPayload {
    txid: string;
    hashed_txid: string;
    label: string | null;
    exchange_rate_id: string | null;
    transaction_time: string | null;
}

export interface WasmMigratedWallet {
    Name: string;
    UserKeyID: string;
    WalletKey: string;
    WalletKeySignature: string;
    Mnemonic: string;
    Fingerprint: string;
}

export interface WasmMigratedWalletAccount {
    ID: string;
    Label: string;
}

export interface WasmMigratedWalletTransaction {
    ID: string;
    WalletAccountID: string;
    HashedTransactionID: string | null;
    Label: string | null;
}

/**
*/
export class WasmAccount {
  free(): void;
/**
* @param {WasmWallet} wallet
* @param {WasmScriptType} script_type
* @param {WasmDerivationPath} derivation_path
*/
  constructor(wallet: WasmWallet, script_type: WasmScriptType, derivation_path: WasmDerivationPath);
/**
* @param {number} from
* @param {number | undefined} [to]
* @returns {Promise<void>}
*/
  markReceiveAddressesUsedTo(from: number, to?: number): Promise<void>;
/**
* @returns {Promise<WasmAddressInfo>}
*/
  getNextReceiveAddress(): Promise<WasmAddressInfo>;
/**
* @param {number} index
* @returns {Promise<WasmAddressInfo>}
*/
  peekReceiveAddress(index: number): Promise<WasmAddressInfo>;
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
* @returns {string}
*/
  getDerivationPath(): string;
/**
* @returns {Promise<WasmUtxoArray>}
*/
  getUtxos(): Promise<WasmUtxoArray>;
/**
* @param {WasmPagination | undefined} [pagination]
* @param {WasmSortOrder | undefined} [sort]
* @returns {Promise<WasmTransactionDetailsArray>}
*/
  getTransactions(pagination?: WasmPagination, sort?: WasmSortOrder): Promise<WasmTransactionDetailsArray>;
/**
* @param {string} txid
* @returns {Promise<WasmTransactionDetailsData>}
*/
  getTransaction(txid: string): Promise<WasmTransactionDetailsData>;
/**
* @returns {Promise<boolean>}
*/
  hasSyncData(): Promise<boolean>;
/**
* @param {WasmPsbt} psbt
* @returns {Promise<void>}
*/
  insertUnconfirmedTransaction(psbt: WasmPsbt): Promise<void>;
/**
* @returns {Promise<void>}
*/
  clearStore(): Promise<void>;
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
* Address
*/
  address: string;
/**
* Child index of this address
*/
  index: number;
/**
* Type of keychain
*/
  keychain: WasmKeychainKind;
}
/**
*/
export class WasmApiBitcoinAddressCreationPayloadData {
  free(): void;
/**
*/
  Data: WasmApiBitcoinAddressCreationPayload;
}
/**
*/
export class WasmApiBitcoinAddressesCreationPayload {
  free(): void;
/**
*/
  constructor();
/**
* @param {WasmApiBitcoinAddressCreationPayload} create_payload
*/
  push(create_payload: WasmApiBitcoinAddressCreationPayload): void;
/**
*/
  0: (WasmApiBitcoinAddressCreationPayloadData)[];
}
/**
*/
export class WasmApiClients {
  free(): void;
/**
*/
  bitcoin_address: WasmBitcoinAddressClient;
/**
*/
  email_integration: WasmEmailIntegrationClient;
/**
*/
  exchange_rate: WasmExchangeRateClient;
/**
*/
  invite: WasmInviteClient;
/**
*/
  network: WasmNetworkClient;
/**
*/
  payment_gateway: WasmPaymentGatewayClient;
/**
*/
  price_graph: WasmPriceGraphClient;
/**
*/
  settings: WasmSettingsClient;
/**
*/
  wallet: WasmWalletClient;
}
/**
*/
export class WasmApiExchangeRateData {
  free(): void;
/**
*/
  Data: WasmApiExchangeRate;
}
/**
*/
export class WasmApiFiatCurrencies {
  free(): void;
/**
*/
  0: (WasmApiFiatCurrencyData)[];
}
/**
*/
export class WasmApiFiatCurrencyData {
  free(): void;
/**
*/
  Data: WasmApiFiatCurrency;
}
/**
*/
export class WasmApiWalletAccountAddresses {
  free(): void;
/**
*/
  0: (WasmWalletAccountAddressData)[];
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
export class WasmApiWalletBitcoinAddressData {
  free(): void;
/**
*/
  Data: WasmApiWalletBitcoinAddress;
}
/**
*/
export class WasmApiWalletBitcoinAddressLookupData {
  free(): void;
/**
*/
  Data: WasmApiWalletBitcoinAddressLookup;
}
/**
*/
export class WasmApiWalletBitcoinAddresses {
  free(): void;
/**
*/
  0: (WasmApiWalletBitcoinAddressData)[];
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
export class WasmApiWalletTransactionData {
  free(): void;
/**
*/
  Data: WasmApiWalletTransaction;
}
/**
*/
export class WasmApiWalletTransactions {
  free(): void;
/**
*/
  0: (WasmApiWalletTransactionData)[];
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
export class WasmBitcoinAddressClient {
  free(): void;
/**
* @param {string} wallet_id
* @param {string} wallet_account_id
* @param {number | undefined} [only_without_bitcoin_addresses]
* @returns {Promise<WasmApiWalletBitcoinAddresses>}
*/
  getBitcoinAddresses(wallet_id: string, wallet_account_id: string, only_without_bitcoin_addresses?: number): Promise<WasmApiWalletBitcoinAddresses>;
/**
* @param {string} wallet_id
* @param {string} wallet_account_id
* @returns {Promise<bigint>}
*/
  getBitcoinAddressHighestIndex(wallet_id: string, wallet_account_id: string): Promise<bigint>;
/**
* @param {string} wallet_id
* @param {string} wallet_account_id
* @param {WasmApiBitcoinAddressesCreationPayload} bitcoin_addresses
* @returns {Promise<WasmApiWalletBitcoinAddresses>}
*/
  addBitcoinAddress(wallet_id: string, wallet_account_id: string, bitcoin_addresses: WasmApiBitcoinAddressesCreationPayload): Promise<WasmApiWalletBitcoinAddresses>;
/**
* @param {string} wallet_id
* @param {string} wallet_account_id
* @param {string} wallet_account_bitcoin_address_id
* @param {WasmApiBitcoinAddressCreationPayload} bitcoin_address
* @returns {Promise<WasmApiWalletBitcoinAddressData>}
*/
  updateBitcoinAddress(wallet_id: string, wallet_account_id: string, wallet_account_bitcoin_address_id: string, bitcoin_address: WasmApiBitcoinAddressCreationPayload): Promise<WasmApiWalletBitcoinAddressData>;
}
/**
*/
export class WasmBlockchainClient {
  free(): void;
/**
* Generates a Mnemonic with a random entropy based on the given word
* count.
* @param {WasmProtonWalletApiClient} proton_api_client
*/
  constructor(proton_api_client: WasmProtonWalletApiClient);
/**
* @returns {Promise<Map<string, number>>}
*/
  getFeesEstimation(): Promise<Map<string, number>>;
/**
* @param {WasmAccount} account
* @param {number | undefined} [stop_gap]
* @returns {Promise<void>}
*/
  fullSync(account: WasmAccount, stop_gap?: number): Promise<void>;
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
* @param {WasmPsbt} psbt
* @param {string} wallet_id
* @param {string} wallet_account_id
* @param {WasmTransactionData} transaction_data
* @param {WasmEmailIntegrationData | undefined} [email_integration]
* @returns {Promise<string>}
*/
  broadcastPsbt(psbt: WasmPsbt, wallet_id: string, wallet_account_id: string, transaction_data: WasmTransactionData, email_integration?: WasmEmailIntegrationData): Promise<string>;
}
/**
*/
export class WasmCountriesAndProviderTupple {
  free(): void;
/**
*/
  0: WasmGatewayProvider;
/**
*/
  1: WasmCountries;
}
/**
*/
export class WasmCountriesByProvider {
  free(): void;
/**
*/
  data: (WasmCountriesAndProviderTupple)[];
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
* @param {WasmScriptType} script_type
* @param {WasmNetwork} network
* @param {number} account_index
* @returns {WasmDerivationPath}
*/
  static fromParts(script_type: WasmScriptType, network: WasmNetwork, account_index: number): WasmDerivationPath;
/**
* @param {string} str
* @returns {WasmDerivationPath}
*/
  static fromString(str: string): WasmDerivationPath;
}
/**
*/
export class WasmDetailledTxIn {
  free(): void;
/**
*/
  previous_output?: WasmTxOut;
/**
*/
  script_sig: WasmScript;
/**
*/
  sequence: WasmSequence;
}
/**
*/
export class WasmDiscoveredAccount {
  free(): void;
/**
*/
  0: WasmScriptType;
/**
*/
  1: number;
/**
*/
  2: WasmDerivationPath;
}
/**
*/
export class WasmDiscoveredAccounts {
  free(): void;
/**
*/
  data: (WasmDiscoveredAccount)[];
}
/**
*/
export class WasmEmailIntegrationClient {
  free(): void;
/**
* @param {string} email
* @returns {Promise<WasmApiWalletBitcoinAddressLookupData>}
*/
  lookupBitcoinAddress(email: string): Promise<WasmApiWalletBitcoinAddressLookupData>;
/**
* @param {string} email
* @returns {Promise<void>}
*/
  createBitcoinAddressesRequest(email: string): Promise<void>;
}
/**
*/
export class WasmExchangeRateClient {
  free(): void;
/**
* @param {WasmFiatCurrencySymbol} fiat
* @param {bigint | undefined} [time]
* @returns {Promise<WasmApiExchangeRateData>}
*/
  getExchangeRate(fiat: WasmFiatCurrencySymbol, time?: bigint): Promise<WasmApiExchangeRateData>;
/**
* @returns {Promise<WasmApiFiatCurrencies>}
*/
  getAllFiatCurrencies(): Promise<WasmApiFiatCurrencies>;
}
/**
*/
export class WasmFiatCurrenciesAndProviderTupple {
  free(): void;
/**
*/
  0: WasmGatewayProvider;
/**
*/
  1: WasmFiatCurrencies;
}
/**
*/
export class WasmFiatCurrenciesByProvider {
  free(): void;
/**
*/
  data: (WasmFiatCurrenciesAndProviderTupple)[];
}
/**
*/
export class WasmInviteClient {
  free(): void;
/**
* @param {string} invitee_email
* @param {string} inviter_address_id
* @returns {Promise<void>}
*/
  sendNewcomerInvite(invitee_email: string, inviter_address_id: string): Promise<void>;
/**
* @param {string} invitee_email
* @param {WasmInviteNotificationType} invite_notification_type
* @param {string} inviter_address_id
* @returns {Promise<number>}
*/
  checkInviteStatus(invitee_email: string, invite_notification_type: WasmInviteNotificationType, inviter_address_id: string): Promise<number>;
/**
* @param {string} invitee_email
* @param {string} inviter_address_id
* @returns {Promise<void>}
*/
  sendEmailIntegrationInvite(invitee_email: string, inviter_address_id: string): Promise<void>;
/**
* @returns {Promise<WasmRemainingMonthlyInvitations>}
*/
  getRemainingMonthlyInvitation(): Promise<WasmRemainingMonthlyInvitations>;
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
export class WasmMigratedWalletAccountData {
  free(): void;
/**
*/
  Data: WasmMigratedWalletAccount;
}
/**
*/
export class WasmMigratedWalletAccounts {
  free(): void;
/**
*/
  constructor();
/**
* @param {WasmMigratedWalletAccount} account_data
*/
  push(account_data: WasmMigratedWalletAccount): void;
/**
*/
  0: (WasmMigratedWalletAccountData)[];
}
/**
*/
export class WasmMigratedWalletTransactionData {
  free(): void;
/**
*/
  Data: WasmMigratedWalletTransaction;
}
/**
*/
export class WasmMigratedWalletTransactions {
  free(): void;
/**
*/
  constructor();
/**
* @param {WasmMigratedWalletTransaction} account_data
*/
  push(account_data: WasmMigratedWalletTransaction): void;
/**
*/
  0: (WasmMigratedWalletTransactionData)[];
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
export class WasmPaymentGatewayClient {
  free(): void;
/**
* @returns {Promise<WasmCountriesByProvider>}
*/
  getCountries(): Promise<WasmCountriesByProvider>;
/**
* @returns {Promise<WasmFiatCurrenciesByProvider>}
*/
  getFiatCurrencies(): Promise<WasmFiatCurrenciesByProvider>;
/**
* @param {string} fiat_currency
* @returns {Promise<WasmPaymentMethodsByProvider>}
*/
  getPaymentMethods(fiat_currency: string): Promise<WasmPaymentMethodsByProvider>;
/**
* @param {number} amount
* @param {string} fiat_currency
* @param {WasmPaymentMethod | undefined} [payment_method]
* @param {WasmGatewayProvider | undefined} [provider]
* @returns {Promise<WasmQuotesByProvider>}
*/
  getQuotes(amount: number, fiat_currency: string, payment_method?: WasmPaymentMethod, provider?: WasmGatewayProvider): Promise<WasmQuotesByProvider>;
/**
* @param {string} amount
* @param {string} btc_address
* @param {string} fiat_currency
* @param {WasmPaymentMethod} payment_method
* @param {WasmGatewayProvider} provider
* @returns {Promise<string>}
*/
  createOnRampCheckout(amount: string, btc_address: string, fiat_currency: string, payment_method: WasmPaymentMethod, provider: WasmGatewayProvider): Promise<string>;
/**
* @param {string} url
* @param {WasmGatewayProvider} provider
* @returns {Promise<string>}
*/
  signUrl(url: string, provider: WasmGatewayProvider): Promise<string>;
/**
* @param {WasmGatewayProvider} provider
* @returns {Promise<string>}
*/
  getPublicApiKey(provider: WasmGatewayProvider): Promise<string>;
/**
* @param {number} amount
* @param {string} address
* @param {string} fiat_currency
* @param {WasmPaymentMethod} payment_method
* @param {WasmGatewayProvider} provider
* @returns {string}
*/
  getCheckoutIframeSrc(amount: number, address: string, fiat_currency: string, payment_method: WasmPaymentMethod, provider: WasmGatewayProvider): string;
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
export class WasmPaymentMethodsAndProviderTupple {
  free(): void;
/**
*/
  0: WasmGatewayProvider;
/**
*/
  1: WasmPaymentMethods;
}
/**
*/
export class WasmPaymentMethodsByProvider {
  free(): void;
/**
*/
  data: (WasmPaymentMethodsAndProviderTupple)[];
}
/**
*/
export class WasmPriceGraphClient {
  free(): void;
/**
* @param {WasmFiatCurrencySymbol} fiat_currency
* @param {WasmTimeframe} timeframe
* @returns {Promise<WasmWrappedPriceGraph>}
*/
  getGraphData(fiat_currency: WasmFiatCurrencySymbol, timeframe: WasmTimeframe): Promise<WasmWrappedPriceGraph>;
}
/**
*/
export class WasmProtonWalletApiClient {
  free(): void;
/**
* @param {string} app_version
* @param {string} user_agent
* @param {string | undefined} [uid_str]
* @param {string | undefined} [origin]
* @param {string | undefined} [url_prefix]
*/
  constructor(app_version: string, user_agent: string, uid_str?: string, origin?: string, url_prefix?: string);
/**
* @returns {WasmApiClients}
*/
  clients(): WasmApiClients;
}
/**
*/
export class WasmPsbt {
  free(): void;
/**
* @param {WasmAccount} wasm_account
* @param {WasmNetwork} network
* @returns {Promise<WasmPsbt>}
*/
  sign(wasm_account: WasmAccount, network: WasmNetwork): Promise<WasmPsbt>;
/**
* @returns {number}
*/
  computeTxSize(): number;
/**
*/
  recipients: (WasmPsbtRecipient)[];
/**
*/
  total_fees: bigint;
}
/**
*/
export class WasmPsbtAndTxBuilder {
  free(): void;
/**
*/
  0: WasmPsbt;
/**
*/
  1: WasmTxBuilder;
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
export class WasmQuotesAndProviderTupple {
  free(): void;
/**
*/
  0: WasmGatewayProvider;
/**
*/
  1: WasmQuotes;
}
/**
*/
export class WasmQuotesByProvider {
  free(): void;
/**
*/
  data: (WasmQuotesAndProviderTupple)[];
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
  2: bigint;
}
/**
*/
export class WasmRemainingMonthlyInvitations {
  free(): void;
/**
*/
  Available: number;
/**
*/
  Used: number;
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
* @returns {Promise<WasmUserSettingsData>}
*/
  getUserSettings(): Promise<WasmUserSettingsData>;
/**
* @param {WasmBitcoinUnit} symbol
* @returns {Promise<WasmUserSettingsData>}
*/
  setBitcoinUnit(symbol: WasmBitcoinUnit): Promise<WasmUserSettingsData>;
/**
* @param {WasmFiatCurrencySymbol} symbol
* @returns {Promise<WasmUserSettingsData>}
*/
  setFiatCurrency(symbol: WasmFiatCurrencySymbol): Promise<WasmUserSettingsData>;
/**
* @param {bigint} amount
* @returns {Promise<WasmUserSettingsData>}
*/
  setTwoFaThreshold(amount: bigint): Promise<WasmUserSettingsData>;
/**
* @param {boolean} hide_empty_used_addresses
* @returns {Promise<WasmUserSettingsData>}
*/
  setHideEmptyUsedAddresses(hide_empty_used_addresses: boolean): Promise<WasmUserSettingsData>;
/**
* @param {WasmUserReceiveNotificationEmailTypes} email_type
* @param {boolean} is_enable
* @returns {Promise<WasmUserSettingsData>}
*/
  setReceiveNotificationEmail(email_type: WasmUserReceiveNotificationEmailTypes, is_enable: boolean): Promise<WasmUserSettingsData>;
/**
* @returns {Promise<WasmUserSettingsData>}
*/
  acceptTermsAndConditions(): Promise<WasmUserSettingsData>;
/**
* @returns {Promise<number>}
*/
  getUserWalletEligibility(): Promise<number>;
}
/**
*/
export class WasmTransaction {
  free(): void;
/**
* @param {WasmPsbt} value
* @returns {WasmTransaction}
*/
  static fromPsbt(value: WasmPsbt): WasmTransaction;
}
/**
*/
export class WasmTransactionDetailsArray {
  free(): void;
/**
*/
  0: (WasmTransactionDetailsData)[];
}
/**
*/
export class WasmTransactionDetailsData {
  free(): void;
/**
*/
  Data: WasmTransactionDetails;
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
* @returns {WasmTxBuilder}
*/
  setAccount(account: WasmAccount): WasmTxBuilder;
/**
* @returns {Promise<WasmTxBuilder>}
*/
  constrainRecipientAmounts(): Promise<WasmTxBuilder>;
/**
* @returns {WasmTxBuilder}
*/
  clearRecipients(): WasmTxBuilder;
/**
* @param {string | undefined} [address_str]
* @param {bigint | undefined} [amount]
* @returns {WasmTxBuilder}
*/
  addRecipient(address_str?: string, amount?: bigint): WasmTxBuilder;
/**
* @param {number} index
* @returns {WasmTxBuilder}
*/
  removeRecipient(index: number): WasmTxBuilder;
/**
* @param {number} index
* @param {string | undefined} [address_str]
* @param {bigint | undefined} [amount]
* @returns {WasmTxBuilder}
*/
  updateRecipient(index: number, address_str?: string, amount?: bigint): WasmTxBuilder;
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
* @param {bigint} sat_per_vb
* @returns {WasmTxBuilder}
*/
  setFeeRate(sat_per_vb: bigint): WasmTxBuilder;
/**
* @returns {bigint | undefined}
*/
  getFeeRate(): bigint | undefined;
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
* @returns {Promise<WasmPsbt>}
*/
  createPsbt(network: WasmNetwork): Promise<WasmPsbt>;
/**
* @param {WasmNetwork} network
* @param {boolean | undefined} [allow_dust]
* @returns {Promise<WasmPsbt>}
*/
  createDraftPsbt(network: WasmNetwork, allow_dust?: boolean): Promise<WasmPsbt>;
}
/**
*/
export class WasmTxOut {
  free(): void;
/**
*/
  address: string;
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
export class WasmUserSettingsData {
  free(): void;
/**
*/
  0: WasmUserSettings;
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
*/
  constructor(network: WasmNetwork, bip39_mnemonic: string, bip38_passphrase?: string);
/**
* @param {number} script_type
* @param {string} derivation_path
* @returns {WasmAccount}
*/
  addAccount(script_type: number, derivation_path: string): WasmAccount;
/**
* @param {WasmProtonWalletApiClient} api_client
* @returns {Promise<WasmDiscoveredAccounts>}
*/
  discoverAccounts(api_client: WasmProtonWalletApiClient): Promise<WasmDiscoveredAccounts>;
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
* @param {WasmSortOrder | undefined} [sort]
* @returns {Promise<WasmTransactionDetailsArray>}
*/
  getTransactions(pagination?: WasmPagination, sort?: WasmSortOrder): Promise<WasmTransactionDetailsArray>;
/**
* @param {WasmDerivationPath} account_key
* @param {string} txid
* @returns {Promise<WasmTransactionDetailsData>}
*/
  getTransaction(account_key: WasmDerivationPath, txid: string): Promise<WasmTransactionDetailsData>;
/**
* @returns {string}
*/
  getFingerprint(): string;
/**
*/
  clearStore(): void;
}
/**
*/
export class WasmWalletAccountAddressData {
  free(): void;
/**
*/
  Data: WasmApiEmailAddress;
}
/**
*/
export class WasmWalletAccountData {
  free(): void;
/**
*/
  Data: WasmApiWalletAccount;
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
* @param {string} wallet_key_signature
* @param {string | undefined} [mnemonic]
* @param {string | undefined} [fingerprint]
* @param {string | undefined} [public_key]
* @param {boolean | undefined} [is_auto_created]
* @returns {Promise<WasmApiWalletData>}
*/
  createWallet(name: string, is_imported: boolean, wallet_type: number, has_passphrase: boolean, user_key_id: string, wallet_key: string, wallet_key_signature: string, mnemonic?: string, fingerprint?: string, public_key?: string, is_auto_created?: boolean): Promise<WasmApiWalletData>;
/**
* @param {string} wallet_id
* @param {WasmMigratedWallet} migrated_wallet
* @param {WasmMigratedWalletAccounts} migrated_wallet_accounts
* @param {WasmMigratedWalletTransactions} migrated_wallet_transactions
* @returns {Promise<void>}
*/
  migrate(wallet_id: string, migrated_wallet: WasmMigratedWallet, migrated_wallet_accounts: WasmMigratedWalletAccounts, migrated_wallet_transactions: WasmMigratedWalletTransactions): Promise<void>;
/**
* @param {string} wallet_id
* @param {string} name
* @returns {Promise<void>}
*/
  updateWalletName(wallet_id: string, name: string): Promise<void>;
/**
* @param {string} wallet_id
* @returns {Promise<void>}
*/
  disableShowWalletRecovery(wallet_id: string): Promise<void>;
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
* @param {string} wallet_account_id
* @returns {Promise<WasmApiWalletAccountAddresses>}
*/
  getWalletAccountAddresses(wallet_id: string, wallet_account_id: string): Promise<WasmApiWalletAccountAddresses>;
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
* @param {WasmFiatCurrencySymbol} symbol
* @returns {Promise<WasmWalletAccountData>}
*/
  updateWalletAccountFiatCurrency(wallet_id: string, wallet_account_id: string, symbol: WasmFiatCurrencySymbol): Promise<WasmWalletAccountData>;
/**
* @param {string} wallet_id
* @param {string} wallet_account_id
* @param {string} label
* @returns {Promise<WasmWalletAccountData>}
*/
  updateWalletAccountLabel(wallet_id: string, wallet_account_id: string, label: string): Promise<WasmWalletAccountData>;
/**
* @param {string} wallet_id
* @param {(string)[]} wallet_account_ids
* @returns {Promise<WasmApiWalletAccounts>}
*/
  updateWalletAccountsOrder(wallet_id: string, wallet_account_ids: (string)[]): Promise<WasmApiWalletAccounts>;
/**
* @param {string} wallet_id
* @param {string} wallet_account_id
* @param {number} last_used_index
* @returns {Promise<WasmWalletAccountData>}
*/
  updateWalletAccountLastUsedIndex(wallet_id: string, wallet_account_id: string, last_used_index: number): Promise<WasmWalletAccountData>;
/**
* @param {string} wallet_id
* @param {string} wallet_account_id
* @param {string} email_address_id
* @returns {Promise<WasmWalletAccountData>}
*/
  addEmailAddress(wallet_id: string, wallet_account_id: string, email_address_id: string): Promise<WasmWalletAccountData>;
/**
* @param {string} wallet_id
* @param {string} wallet_account_id
* @param {string} email_address_id
* @returns {Promise<WasmWalletAccountData>}
*/
  removeEmailAddress(wallet_id: string, wallet_account_id: string, email_address_id: string): Promise<WasmWalletAccountData>;
/**
* @param {string} wallet_id
* @param {string} wallet_account_id
* @returns {Promise<void>}
*/
  deleteWalletAccount(wallet_id: string, wallet_account_id: string): Promise<void>;
/**
* @param {string} wallet_id
* @param {string | undefined} [wallet_account_id]
* @param {(string)[] | undefined} [hashed_txids]
* @returns {Promise<WasmApiWalletTransactions>}
*/
  getWalletTransactions(wallet_id: string, wallet_account_id?: string, hashed_txids?: (string)[]): Promise<WasmApiWalletTransactions>;
/**
* @param {string} wallet_id
* @param {string | undefined} [wallet_account_id]
* @returns {Promise<WasmApiWalletTransactions>}
*/
  getWalletTransactionsToHash(wallet_id: string, wallet_account_id?: string): Promise<WasmApiWalletTransactions>;
/**
* @param {string} wallet_id
* @param {string} wallet_account_id
* @param {WasmCreateWalletTransactionPayload} payload
* @returns {Promise<WasmApiWalletTransactionData>}
*/
  createWalletTransaction(wallet_id: string, wallet_account_id: string, payload: WasmCreateWalletTransactionPayload): Promise<WasmApiWalletTransactionData>;
/**
* @param {string} wallet_id
* @param {string} wallet_account_id
* @param {string} wallet_transaction_id
* @param {string} label
* @returns {Promise<WasmApiWalletTransactionData>}
*/
  updateWalletTransactionLabel(wallet_id: string, wallet_account_id: string, wallet_transaction_id: string, label: string): Promise<WasmApiWalletTransactionData>;
/**
* @param {string} wallet_id
* @param {string} wallet_account_id
* @param {string} wallet_transaction_id
* @param {string} hash_txid
* @returns {Promise<WasmApiWalletTransactionData>}
*/
  updateWalletTransactionHashedTxId(wallet_id: string, wallet_account_id: string, wallet_transaction_id: string, hash_txid: string): Promise<WasmApiWalletTransactionData>;
/**
* @param {string} wallet_id
* @param {string} wallet_account_id
* @param {string} wallet_transaction_id
* @param {string} sender
* @returns {Promise<WasmApiWalletTransactionData>}
*/
  updateExternalWalletTransactionSender(wallet_id: string, wallet_account_id: string, wallet_transaction_id: string, sender: string): Promise<WasmApiWalletTransactionData>;
/**
* @param {string} wallet_id
* @param {string} wallet_account_id
* @param {string} wallet_transaction_id
* @param {WasmWalletTransactionFlag} flag
* @returns {Promise<WasmApiWalletTransactionData>}
*/
  setWalletTransactionFlag(wallet_id: string, wallet_account_id: string, wallet_transaction_id: string, flag: WasmWalletTransactionFlag): Promise<WasmApiWalletTransactionData>;
/**
* @param {string} wallet_id
* @param {string} wallet_account_id
* @param {string} wallet_transaction_id
* @param {WasmWalletTransactionFlag} flag
* @returns {Promise<WasmApiWalletTransactionData>}
*/
  deleteWalletTransactionFlag(wallet_id: string, wallet_account_id: string, wallet_transaction_id: string, flag: WasmWalletTransactionFlag): Promise<WasmApiWalletTransactionData>;
/**
* @param {string} wallet_id
* @param {string} wallet_account_id
* @param {string} wallet_transaction_id
* @returns {Promise<void>}
*/
  deleteWalletTransaction(wallet_id: string, wallet_account_id: string, wallet_transaction_id: string): Promise<void>;
}
/**
*/
export class WasmWrappedPriceGraph {
  free(): void;
/**
*/
  data: WasmPriceGraph;
}

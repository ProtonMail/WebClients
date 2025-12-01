/* tslint:disable */
/* eslint-disable */
export function createTransactionFromPsbt(psbt: WasmPsbt, account: WasmAccount): Promise<WasmTransactionDetailsData>;
export function getWordsAutocomplete(word_start: string): string[];
export function setPanicHook(): void;
export function getDefaultStopGap(): number;
export enum WasmChangeSpendPolicy {
  ChangeAllowed = 0,
  OnlyChange = 1,
  ChangeForbidden = 2,
}
export enum WasmCoinSelection {
  BranchAndBound = 0,
  LargestFirst = 1,
  OldestFirst = 2,
  Manual = 3,
}
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
export enum WasmPaymentLinkKind {
  BitcoinAddress = 0,
  BitcoinURI = 1,
  LightningURI = 2,
  UnifiedURI = 3,
}
export enum WasmScriptType {
  Legacy = 1,
  NestedSegwit = 2,
  NativeSegwit = 3,
  Taproot = 4,
}
export enum WasmSigningType {
  Electrum = 1,
  Bip137 = 2,
}
export enum WasmSortOrder {
  Asc = 0,
  Desc = 1,
}
export enum WasmTransactionFilter {
  All = 0,
  Receive = 1,
  Send = 2,
}
export enum WasmWalletTransactionFlag {
  Suspicious = 0,
  Private = 1,
}
export enum WasmWordCount {
  Words12 = 0,
  Words15 = 1,
  Words18 = 2,
  Words21 = 3,
  Words24 = 4,
}
export interface WasmApiCountry {
    Code: string;
    FiatCurrency: string;
    Name: string;
}

export interface WasmApiSimpleFiatCurrency {
    Symbol: string;
    Name: string;
    MinimumAmount: string | null;
}

export interface WasmQuote {
    BitcoinAmount: string;
    FiatAmount: string;
    FiatCurrencySymbol: string;
    NetworkFee: string;
    PaymentGatewayFee: string;
    PaymentMethod: WasmPaymentMethod;
    PurchaseAmount: string | null;
    PaymentProcessingFee: string | null;
    OrderID: string | null;
}

export interface WasmFiatCurrencies {
    data: WasmApiSimpleFiatCurrency[];
}

export interface WasmQuotes {
    data: WasmQuote[];
}

export interface WasmCountries {
    data: WasmApiCountry[];
}

export interface WasmCreateOnRampCheckoutResponseBody {
    Code: number;
    CheckoutUrl: string;
    InvoiceID: string;
}

export type WasmGatewayProvider = "Banxa" | "Ramp" | "MoonPay" | "Azteco" | "Unsupported";

export type WasmPaymentMethod = "ApplePay" | "BankTransfer" | "Card" | "GooglePay" | "InstantPayment" | "Paypal" | "Unsupported";

export interface WasmPaymentMethods {
    data: WasmPaymentMethod[];
}

export interface WasmTxOut {
    value: number;
    script_pubkey: WasmScript;
    is_mine: boolean;
    address: string | null;
}

export interface WasmTransactionDetails {
    txid: string;
    is_send: boolean;
    value: number;
    value_with_fee: number;
    transaction_value: number;
    fee: number;
    size: number;
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

export interface WasmApiWalletBitcoinAddressLookup {
    BitcoinAddress: string | null;
    BitcoinAddressSignature: string | null;
}

export interface WasmApiBitcoinAddressCreationPayload {
    BitcoinAddress: string;
    BitcoinAddressSignature: string;
    BitcoinAddressIndex: number;
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

export type WasmInviteNotificationType = "Newcomer" | "EmailIntegration" | "Unsupported";

export interface WasmApiFiatCurrency {
    ID: string;
    Name: string;
    Symbol: WasmFiatCurrencySymbol;
    Sign: string;
    Cents: number;
}

export interface WasmApiExchangeRate {
    ID: string;
    BitcoinUnit: WasmBitcoinUnit;
    FiatCurrency: WasmFiatCurrencySymbol;
    Sign: string | null;
    ExchangeRateTime: string;
    ExchangeRate: number;
    Cents: number;
}

export interface WasmApiWalletBitcoinAddressLookup {
    BitcoinAddress: string | null;
    BitcoinAddressSignature: string | null;
}

export interface WasmMigratedWalletTransaction {
    ID: string;
    WalletAccountID: string;
    HashedTransactionID: string | null;
    Label: string | null;
}

export type WasmTransactionType = "NotSend" | "ProtonToProtonSend" | "ProtonToProtonReceive" | "ExternalSend" | "ExternalReceive" | "Unsupported";

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
    StopGap: number;
    Addresses: WasmApiEmailAddress[];
}

export interface WasmMigratedWallet {
    /**
     * Name of the wallet, encrypted
     */
    Name: string;
    /**
     * Encrypted user Id
     */
    UserKeyID: string;
    /**
     * Base64 encoded binary data
     */
    WalletKey: string;
    /**
     * Detached signature of the encrypted AES-GCM 256 key used to encrypt the
     * mnemonic or public key, as armored PGP
     */
    WalletKeySignature: string;
    /**
     * Wallet mnemonic encrypted with the WalletKey, in base64 format
     */
    Mnemonic: string;
    Fingerprint: string;
}

export interface WasmCreateWalletTransactionPayload {
    txid: string;
    hashed_txid: string;
    label: string | null;
    exchange_rate_id: string | null;
    transaction_time: string | null;
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
    Legacy: number | null;
}

export interface WasmApiWalletKey {
    WalletID: string;
    UserKeyID: string;
    WalletKey: string;
    WalletKeySignature: string;
}

export interface WasmMigratedWalletAccount {
    ID: string;
    Label: string;
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
    IsAnonymous: number | null;
    ExchangeRate: WasmApiExchangeRate | null;
    HashedTransactionID: string | null;
    Subject: string | null;
    Body: string | null;
    ToList: string | null;
    Sender: string | null;
}

export interface WasmUserSettings {
    AcceptTermsAndConditions: number | null;
    BitcoinUnit: WasmBitcoinUnit;
    FiatCurrency: WasmFiatCurrencySymbol;
    HideEmptyUsedAddresses: number;
    TwoFactorAmountThreshold: number | null;
    ReceiveInviterNotification: number | null;
    ReceiveEmailIntegrationNotification: number | null;
    ReceiveTransactionNotification: number | null;
    WalletCreated: number | null;
}

export type WasmFiatCurrencySymbol = "ALL" | "DZD" | "ARS" | "AMD" | "AUD" | "AZN" | "BHD" | "BDT" | "BYN" | "BMD" | "BOB" | "BAM" | "BRL" | "BGN" | "KHR" | "CAD" | "CLP" | "CNY" | "COP" | "CRC" | "HRK" | "CUP" | "CZK" | "DKK" | "DOP" | "EGP" | "EUR" | "GEL" | "GHS" | "GTQ" | "HNL" | "HKD" | "HUF" | "ISK" | "INR" | "IDR" | "IRR" | "IQD" | "ILS" | "JMD" | "JPY" | "JOD" | "KZT" | "KES" | "KWD" | "KGS" | "LBP" | "MKD" | "MYR" | "MUR" | "MXN" | "MDL" | "MNT" | "MAD" | "MMK" | "NAD" | "NPR" | "TWD" | "NZD" | "NIO" | "NGN" | "NOK" | "OMR" | "PKR" | "PAB" | "PEN" | "PHP" | "PLN" | "GBP" | "QAR" | "RON" | "RUB" | "SAR" | "RSD" | "SGD" | "ZAR" | "KRW" | "SSP" | "VES" | "LKR" | "SEK" | "CHF" | "THB" | "TTD" | "TND" | "TRY" | "UGX" | "UAH" | "AED" | "USD" | "UYU" | "UZS" | "VND";

export type WasmUserReceiveNotificationEmailTypes = "NotificationToInviter" | "EmailIntegration" | "TransactionalBvE" | "Unsupported";

export type WasmBitcoinUnit = "BTC" | "MBTC" | "SATS";

export interface WasmPagination {
    skip: number;
    take: number;
}

export interface WasmAddressInfo {
    /**
     * Child index of this address
     */
    index: number;
    /**
     * Address
     */
    address: string;
    /**
     * Type of keychain
     */
    keychain: WasmKeychainKind;
}

export interface WasmBalance {
    /**
     * All coinbase outputs not yet matured
     */
    immature: number;
    /**
     * Unconfirmed UTXOs generated by a wallet tx
     */
    trusted_pending: number;
    /**
     * Unconfirmed UTXOs received from an external wallet
     */
    untrusted_pending: number;
    /**
     * Confirmed and immediately spendable balance
     */
    confirmed: number;
    /**
     * Get sum of trusted_pending and confirmed coins.
     *
     * This is the balance you can spend right now that shouldn\'t get cancelled via another party
     * double spending it.
     */
    trusted_spendable: number;
}

export interface WasmPriceGraph {
    FiatCurrency: WasmFiatCurrencySymbol;
    BitcoinUnit: WasmBitcoinUnit;
    GraphData: WasmDataPoint[];
}

export type WasmTimeframe = "OneDay" | "OneWeek" | "OneMonth" | "Unsupported";

export interface WasmDataPoint {
    ExchangeRate: number;
    Cents: number;
    Timestamp: number;
}

export interface WasmTransactionData {
    label: string | null;
    exchange_rate_or_transaction_time: WasmExchangeRateOrTransactionTime;
    is_paper_wallet: number | null;
}

export interface WasmEmailIntegrationData {
    address_id: string | null;
    body: string | null;
    message: WasmBroadcastMessage | null;
    recipients: Record<string, string> | null;
    is_anonymous: number | null;
}

export interface WasmExchangeRateOrTransactionTime {
    key: WasmExchangeRateOrTransactionTimeEnum;
    value: string;
}

export interface WasmBroadcastMessage {
    data_packet: string;
    key_packets: Record<string, string>;
}

export type WasmExchangeRateOrTransactionTimeEnum = "ExchangeRate" | "TransactionTime";

export interface WasmAddressDetails {
    index: number;
    address: string;
    transactions: WasmTransactionDetails[];
    balance: WasmBalance;
    keychain: WasmKeychainKind;
}

export class WasmAccount {
  free(): void;
  [Symbol.dispose](): void;
  clearStore(): Promise<void>;
  getAddress(network: WasmNetwork, address_str: string, client: WasmBlockchainClient, force_sync?: boolean | null): Promise<WasmAddressDetailsData | undefined>;
  getBalance(): Promise<WasmBalanceWrapper>;
  getAddresses(pagination: WasmPagination, client: WasmBlockchainClient, keychain: WasmKeychainKind, force_sync?: boolean | null): Promise<WasmAddressDetailsArray>;
  hasSyncData(): Promise<boolean>;
  getTransaction(txid: string): Promise<WasmTransactionDetailsData>;
  getTransactions(pagination: WasmPagination, filter: WasmTransactionFilter, sort?: WasmSortOrder | null): Promise<WasmTransactionDetailsArray>;
  getConvertedXpub(): Promise<string>;
  getDerivationPath(): string;
  peekReceiveAddress(index: number): Promise<WasmAddressInfo>;
  bumpTransactionsFees(network: WasmNetwork, txid: string, fees: bigint): Promise<WasmPsbt>;
  getNextReceiveAddress(): Promise<WasmAddressInfo>;
  getFullDescriptor(): Promise<string>;
  markReceiveAddressesUsedTo(from: number, to?: number | null): Promise<void>;
  constructor(wallet: WasmWallet, script_type: WasmScriptType, derivation_path: WasmDerivationPath);
  getHighestUsedAddressIndexInOutput(keychain: WasmKeychainKind): Promise<number | undefined>;
  owns(address: WasmAddress): Promise<boolean>;
  getXpub(): Promise<string>;
  getUtxos(): Promise<WasmUtxoArray>;
}
export class WasmAccountStatementGenerator {
  free(): void;
  [Symbol.dispose](): void;
  addAccount(account: WasmAccount, name: string): Promise<void>;
  constructor(wasm_exchange_rate?: WasmApiExchangeRate | null);
  toCsv(export_time: bigint): Promise<Uint8Array>;
  toPdf(export_time: bigint): Promise<Uint8Array>;
}
export class WasmAccountSweeper {
  free(): void;
  [Symbol.dispose](): void;
  getSweepWifPsbt(wif: string, sat_per_vb: bigint, receive_address_index: number, network: WasmNetwork): Promise<WasmPsbt>;
  constructor(client: WasmBlockchainClient, account: WasmAccount);
}
export class WasmAccountSyncer {
  free(): void;
  [Symbol.dispose](): void;
  shouldSync(): Promise<boolean>;
  partialSync(): Promise<void>;
  constructor(client: WasmBlockchainClient, account: WasmAccount);
  fullSync(stop_gap?: number | null): Promise<void>;
}
export class WasmAddress {
  free(): void;
  [Symbol.dispose](): void;
  static fromScript(value: WasmScript, network: WasmNetwork): WasmAddress;
  intoScript(): WasmScript;
  constructor(str: string, network: WasmNetwork);
  toString(): string;
}
export class WasmAddressDetailsArray {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  0: WasmAddressDetailsData[];
}
export class WasmAddressDetailsData {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  Data: WasmAddressDetails;
}
export class WasmAddressInfo {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Child index of this address
   */
  index: number;
  /**
   * Address
   */
  address: string;
  /**
   * Type of keychain
   */
  keychain: WasmKeychainKind;
}
export class WasmApiBitcoinAddressCreationPayloadData {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  Data: WasmApiBitcoinAddressCreationPayload;
}
export class WasmApiBitcoinAddressesCreationPayload {
  free(): void;
  [Symbol.dispose](): void;
  constructor();
  push(create_payload: WasmApiBitcoinAddressCreationPayload): void;
  0: WasmApiBitcoinAddressCreationPayloadData[];
}
export class WasmApiClients {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  exchange_rate: WasmExchangeRateClient;
  email_integration: WasmEmailIntegrationClient;
  bitcoin_address: WasmBitcoinAddressClient;
  payment_gateway: WasmPaymentGatewayClient;
  price_graph: WasmPriceGraphClient;
  settings: WasmSettingsClient;
  network: WasmNetworkClient;
  invite: WasmInviteClient;
  wallet: WasmWalletClient;
}
export class WasmApiExchangeRateData {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  Data: WasmApiExchangeRate;
}
export class WasmApiFiatCurrencies {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  0: WasmApiFiatCurrencyData[];
}
export class WasmApiFiatCurrencyData {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  Data: WasmApiFiatCurrency;
}
export class WasmApiWalletAccountAddresses {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  0: WasmWalletAccountAddressData[];
}
export class WasmApiWalletAccounts {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  0: WasmWalletAccountData[];
}
export class WasmApiWalletBitcoinAddressData {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  Data: WasmApiWalletBitcoinAddress;
}
export class WasmApiWalletBitcoinAddressIndexes {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  0: WasmApiWalletBitcoinAddressUsedIndexData[];
}
export class WasmApiWalletBitcoinAddressLookupData {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  Data: WasmApiWalletBitcoinAddressLookup;
}
export class WasmApiWalletBitcoinAddressUsedIndexData {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  Data: bigint;
}
export class WasmApiWalletBitcoinAddresses {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  0: WasmApiWalletBitcoinAddressData[];
}
export class WasmApiWalletData {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  static from_parts(wallet: WasmApiWallet, key: WasmApiWalletKey, settings: WasmApiWalletSettings): WasmApiWalletData;
  Wallet: WasmApiWallet;
  WalletKey: WasmApiWalletKey;
  WalletSettings: WasmApiWalletSettings;
}
export class WasmApiWalletTransactionData {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  Data: WasmApiWalletTransaction;
}
export class WasmApiWalletTransactions {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  0: WasmApiWalletTransactionData[];
}
export class WasmApiWalletsData {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  0: WasmApiWalletData[];
}
export class WasmAuthData {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  uid: string;
  access: string;
  refresh: string;
  scopes: string[];
}
export class WasmBalanceWrapper {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  data: WasmBalance;
}
export class WasmBitcoinAddressClient {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  getUsedIndexes(wallet_id: string, wallet_account_id: string): Promise<WasmApiWalletBitcoinAddressIndexes>;
  addBitcoinAddresses(wallet_id: string, wallet_account_id: string, bitcoin_addresses: WasmApiBitcoinAddressesCreationPayload): Promise<WasmApiWalletBitcoinAddresses>;
  getBitcoinAddresses(wallet_id: string, wallet_account_id: string, only_without_bitcoin_addresses?: number | null): Promise<WasmApiWalletBitcoinAddresses>;
  updateBitcoinAddress(wallet_id: string, wallet_account_id: string, wallet_account_bitcoin_address_id: string, bitcoin_address: WasmApiBitcoinAddressCreationPayload): Promise<WasmApiWalletBitcoinAddressData>;
  getBitcoinAddressHighestIndex(wallet_id: string, wallet_account_id: string): Promise<bigint>;
}
export class WasmBlockchainClient {
  free(): void;
  [Symbol.dispose](): void;
  broadcastPsbt(psbt: WasmPsbt, wallet_id: string, wallet_account_id: string, transaction_data: WasmTransactionData, email_integration?: WasmEmailIntegrationData | null): Promise<string>;
  getMininumFees(): Promise<WasmMinimumFees>;
  getFeesEstimation(): Promise<Map<string, number>>;
  getRecommendedFees(): Promise<WasmRecommendedFees>;
  /**
   * Generates a Mnemonic with a random entropy based on the given word
   * count.
   */
  constructor(proton_api_client: WasmProtonWalletApiClient);
}
export class WasmCountriesAndProviderTupple {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  0: WasmGatewayProvider;
  1: WasmCountries;
}
export class WasmCountriesByProvider {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  data: WasmCountriesAndProviderTupple[];
}
export class WasmDerivationPath {
  free(): void;
  [Symbol.dispose](): void;
  static fromParts(script_type: WasmScriptType, network: WasmNetwork, account_index: number): WasmDerivationPath;
  constructor(path: string);
  toString(): string;
  static fromString(str: string): WasmDerivationPath;
}
export class WasmDetailledTxIn {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  get previous_output(): WasmTxOut | undefined;
  set previous_output(value: WasmTxOut | null | undefined);
  script_sig: WasmScript;
  sequence: WasmSequence;
}
export class WasmDiscoveredAccount {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  0: WasmScriptType;
  1: number;
  2: WasmDerivationPath;
}
export class WasmDiscoveredAccounts {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  data: WasmDiscoveredAccount[];
}
export class WasmEmailIntegrationClient {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  lookupBitcoinAddress(email: string): Promise<WasmApiWalletBitcoinAddressLookupData>;
  createBitcoinAddressesRequest(email: string): Promise<void>;
}
export class WasmExchangeRateClient {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  getExchangeRate(fiat: WasmFiatCurrencySymbol, time?: bigint | null): Promise<WasmApiExchangeRateData>;
  getAllFiatCurrencies(): Promise<WasmApiFiatCurrencies>;
}
export class WasmFiatCurrenciesAndProviderTupple {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  0: WasmGatewayProvider;
  1: WasmFiatCurrencies;
}
export class WasmFiatCurrenciesByProvider {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  data: WasmFiatCurrenciesAndProviderTupple[];
}
export class WasmInviteClient {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  checkInviteStatus(invitee_email: string, invite_notification_type: WasmInviteNotificationType, inviter_address_id: string): Promise<number>;
  sendNewcomerInvite(invitee_email: string, inviter_address_id: string): Promise<void>;
  sendEmailIntegrationInvite(invitee_email: string, inviter_address_id: string): Promise<void>;
  getRemainingMonthlyInvitation(): Promise<WasmRemainingMonthlyInvitations>;
}
export class WasmLockTime {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  static fromHeight(height: number): WasmLockTime;
  static fromSeconds(seconds: number): WasmLockTime;
  isBlockTime(): boolean;
  isBlockHeight(): boolean;
  toConsensusU32(): number;
}
export class WasmMessageSigner {
  free(): void;
  [Symbol.dispose](): void;
  signMessage(account: WasmAccount, message: string, signing_type: WasmSigningType, btc_address: string): Promise<string>;
  verifyMessage(account: WasmAccount, message: string, signature: string, btc_address: string): Promise<void>;
  constructor();
}
export class WasmMigratedWalletAccountData {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  Data: WasmMigratedWalletAccount;
}
export class WasmMigratedWalletAccounts {
  free(): void;
  [Symbol.dispose](): void;
  constructor();
  push(account_data: WasmMigratedWalletAccount): void;
  0: WasmMigratedWalletAccountData[];
}
export class WasmMigratedWalletTransactionData {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  Data: WasmMigratedWalletTransaction;
}
export class WasmMigratedWalletTransactions {
  free(): void;
  [Symbol.dispose](): void;
  constructor();
  push(account_data: WasmMigratedWalletTransaction): void;
  0: WasmMigratedWalletTransactionData[];
}
export class WasmMinimumFees {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  MinimumBroadcastFee: number;
  MinimumIncrementalFee: number;
}
export class WasmMnemonic {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Parse a Mnemonic with the given string.
   */
  static fromString(mnemonic: string): WasmMnemonic;
  /**
   * Generates a Mnemonic with a random entropy based on the given word
   * count.
   */
  constructor(word_count: WasmWordCount);
  asWords(): string[];
  /**
   * Returns the Mnemonic as a string.
   */
  asString(): string;
}
export class WasmNetworkClient {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  getNetwork(): Promise<WasmNetwork>;
}
export class WasmOnchainPaymentLink {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  get address(): string | undefined;
  set address(value: string | null | undefined);
  get amount(): bigint | undefined;
  set amount(value: bigint | null | undefined);
  get message(): string | undefined;
  set message(value: string | null | undefined);
  get label(): string | undefined;
  set label(value: string | null | undefined);
}
/**
 * Serialised Outpoint under the form <txid>:<index>
 */
export class WasmOutPoint {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  static fromString(str: string): WasmOutPoint;
  0: string;
}
/**
 * A representation of a paper wallet account
 */
export class WasmPaperAccount {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  getWifAddress(): Promise<string>;
  geWif(): Promise<string>;
  static generate(network: WasmNetwork, script_type: WasmScriptType): WasmPaperAccount;
  static newFrom(wif: string, script_type: WasmScriptType, network?: WasmNetwork | null): WasmPaperAccount;
}
export class WasmPaymentGatewayClient {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  getQuotes(amount: number, fiat_currency: string, payment_method?: WasmPaymentMethod | null, provider?: WasmGatewayProvider | null): Promise<WasmQuotesByProvider>;
  getCountries(): Promise<WasmCountriesByProvider>;
  getPublicApiKey(provider: WasmGatewayProvider): Promise<string>;
  getFiatCurrencies(): Promise<WasmFiatCurrenciesByProvider>;
  getPaymentMethods(fiat_currency: string): Promise<WasmPaymentMethodsByProvider>;
  createOnRampCheckout(amount: string, btc_address: string, fiat_currency: string, payment_method: WasmPaymentMethod, provider: WasmGatewayProvider, order_id: string): Promise<WasmCreateOnRampCheckoutResponseBody>;
  getCheckoutIframeSrc(amount: number, address: string, fiat_currency: string, payment_method: WasmPaymentMethod, provider: WasmGatewayProvider): string;
  signUrl(url: string, provider: WasmGatewayProvider): Promise<string>;
}
export class WasmPaymentLink {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  assumeOnchain(): WasmOnchainPaymentLink;
  toAmountInSats(): bigint;
  toUri(): string;
  getKind(): WasmPaymentLinkKind;
  toString(): string;
  static tryParse(str: string, network: WasmNetwork): WasmPaymentLink;
}
export class WasmPaymentMethodsAndProviderTupple {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  0: WasmGatewayProvider;
  1: WasmPaymentMethods;
}
export class WasmPaymentMethodsByProvider {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  data: WasmPaymentMethodsAndProviderTupple[];
}
export class WasmPriceGraphClient {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  getGraphData(fiat_currency: WasmFiatCurrencySymbol, timeframe: WasmTimeframe): Promise<WasmWrappedPriceGraph>;
}
export class WasmProtonWalletApiClient {
  free(): void;
  [Symbol.dispose](): void;
  constructor(app_version: string, user_agent: string, user_id_str?: string | null, uid_str?: string | null, origin?: string | null, url_prefix?: string | null);
  clients(): WasmApiClients;
}
export class WasmPsbt {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  computeTxVbytes(): bigint;
  sign(wasm_account: WasmAccount, network: WasmNetwork): Promise<WasmPsbt>;
  recipients: WasmPsbtRecipient[];
  total_fees: bigint;
  outputs_amount: bigint;
  get public_address(): string | undefined;
  set public_address(value: string | null | undefined);
}
export class WasmPsbtAndTxBuilder {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  0: WasmPsbt;
  1: WasmTxBuilder;
}
export class WasmPsbtRecipient {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  0: string;
  1: bigint;
}
export class WasmQuotesAndProviderTupple {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  0: WasmGatewayProvider;
  1: WasmQuotes;
}
export class WasmQuotesByProvider {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  data: WasmQuotesAndProviderTupple[];
}
export class WasmRecipient {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  0: string;
  1: string;
  2: bigint;
}
export class WasmRecommendedFees {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  FastestFee: number;
  HalfHourFee: number;
  HourFee: number;
  EconomyFee: number;
  MinimumFee: number;
}
export class WasmRemainingMonthlyInvitations {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  Available: number;
  Used: number;
}
export class WasmScript {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  toAddress(network: WasmNetwork): WasmAddress;
  0: Uint8Array;
}
export class WasmSequence {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  0: number;
}
export class WasmSettingsClient {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  setBitcoinUnit(symbol: WasmBitcoinUnit): Promise<WasmUserSettingsData>;
  setFiatCurrency(symbol: WasmFiatCurrencySymbol): Promise<WasmUserSettingsData>;
  setTwoFaThreshold(amount: bigint): Promise<WasmUserSettingsData>;
  getUserSettings(): Promise<WasmUserSettingsData>;
  setHideEmptyUsedAddresses(hide_empty_used_addresses: boolean): Promise<WasmUserSettingsData>;
  setReceiveNotificationEmail(email_type: WasmUserReceiveNotificationEmailTypes, is_enable: boolean): Promise<WasmUserSettingsData>;
  acceptTermsAndConditions(): Promise<WasmUserSettingsData>;
  getUserWalletEligibility(): Promise<number>;
}
export class WasmTransaction {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  static fromPsbt(value: WasmPsbt): WasmTransaction;
}
export class WasmTransactionDetailsArray {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  0: WasmTransactionDetailsData[];
}
export class WasmTransactionDetailsData {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  Data: WasmTransactionDetails;
}
export class WasmTxBuilder {
  free(): void;
  [Symbol.dispose](): void;
  /**
   *
   *     * RBF
   *     
   */
  enableRbf(): WasmTxBuilder;
  /**
   *
   *     * Final
   *     
   */
  createPsbt(network: WasmNetwork): Promise<WasmPsbt>;
  disableRbf(): WasmTxBuilder;
  setAccount(account: WasmAccount): WasmTxBuilder;
  /**
   *
   *     * Locktime
   *     
   */
  addLocktime(locktime: WasmLockTime): WasmTxBuilder;
  getFeeRate(): bigint | undefined;
  getLocktime(): WasmLockTime | undefined;
  /**
   *
   *     * Fees
   *     
   */
  setFeeRate(sat_per_vb: bigint): WasmTxBuilder;
  addRecipient(address_str?: string | null, amount?: bigint | null): WasmTxBuilder;
  getRecipients(): WasmRecipient[];
  getRbfEnabled(): boolean;
  removeLocktime(): WasmTxBuilder;
  clearRecipients(): WasmTxBuilder;
  removeRecipient(index: number): WasmTxBuilder;
  updateRecipient(index: number, address_str?: string | null, amount?: bigint | null): WasmTxBuilder;
  /**
   *
   *     * UTXOs
   *     
   */
  addUtxoToSpend(outpoint: WasmOutPoint): WasmTxBuilder;
  createDraftPsbt(network: WasmNetwork, allow_dust?: boolean | null): Promise<WasmPsbt>;
  getChangePolicy(): WasmChangeSpendPolicy;
  /**
   *
   *     * Change policy
   *     
   */
  setChangePolicy(change_policy: WasmChangeSpendPolicy): WasmTxBuilder;
  getCoinSelection(): WasmCoinSelection;
  getUtxosToSpend(): WasmOutPoint[];
  /**
   *
   *     * Coin selection enforcement
   *     
   */
  setCoinSelection(coin_selection: WasmCoinSelection): WasmTxBuilder;
  clearUtxosToSpend(): WasmTxBuilder;
  removeUtxoToSpend(outpoint: WasmOutPoint): WasmTxBuilder;
  constrainRecipientAmounts(): Promise<WasmTxBuilder>;
  updateRecipientAmountToMax(index: number): Promise<WasmTxBuilder>;
  constructor();
}
export class WasmTxOut {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  value: bigint;
  script_pubkey: WasmScript;
  is_mine: boolean;
  get address(): string | undefined;
  set address(value: string | null | undefined);
}
export class WasmUserSettingsData {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  0: WasmUserSettings;
}
export class WasmUtxo {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  value: bigint;
  outpoint: WasmOutPoint;
  script_pubkey: WasmScript;
  keychain: WasmKeychainKind;
  is_spent: boolean;
}
export class WasmUtxoArray {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  0: WasmUtxo[];
}
export class WasmWallet {
  free(): void;
  [Symbol.dispose](): void;
  addAccount(script_type: number, derivation_path: string): WasmAccount;
  clearStore(): Promise<void>;
  getAccount(derivation_path: string): WasmAccount | undefined;
  getBalance(): Promise<WasmBalanceWrapper>;
  getFingerprint(): string;
  getTransaction(account_key: WasmDerivationPath, txid: string): Promise<WasmTransactionDetailsData>;
  getTransactions(filter: WasmTransactionFilter, pagination?: WasmPagination | null, sort?: WasmSortOrder | null): Promise<WasmTransactionDetailsArray>;
  discoverAccounts(api_client: WasmProtonWalletApiClient): Promise<WasmDiscoveredAccounts>;
  constructor(network: WasmNetwork, bip39_mnemonic: string, bip38_passphrase?: string | null);
}
export class WasmWalletAccountAddressData {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  Data: WasmApiEmailAddress;
}
export class WasmWalletAccountData {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  Data: WasmApiWalletAccount;
}
export class WasmWalletClient {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  getWallets(): Promise<WasmApiWalletsData>;
  createWallet(name: string, is_imported: boolean, wallet_type: number, has_passphrase: boolean, user_key_id: string, wallet_key: string, wallet_key_signature: string, mnemonic?: string | null, fingerprint?: string | null, public_key?: string | null, is_auto_created?: boolean | null): Promise<WasmApiWalletData>;
  deleteWallet(wallet_id: string): Promise<void>;
  addEmailAddress(wallet_id: string, wallet_account_id: string, email_address_id: string): Promise<WasmWalletAccountData>;
  updateWalletName(wallet_id: string, name: string): Promise<void>;
  getWalletAccounts(wallet_id: string): Promise<WasmApiWalletAccounts>;
  removeEmailAddress(wallet_id: string, wallet_account_id: string, email_address_id: string): Promise<WasmWalletAccountData>;
  createWalletAccount(wallet_id: string, derivation_path: WasmDerivationPath, label: string, script_type: WasmScriptType): Promise<WasmWalletAccountData>;
  deleteWalletAccount(wallet_id: string, wallet_account_id: string): Promise<void>;
  getWalletTransactions(wallet_id: string, wallet_account_id?: string | null, hashed_txids?: string[] | null): Promise<WasmApiWalletTransactions>;
  createWalletTransaction(wallet_id: string, wallet_account_id: string, payload: WasmCreateWalletTransactionPayload): Promise<WasmApiWalletTransactionData>;
  deleteWalletTransaction(wallet_id: string, wallet_account_id: string, wallet_transaction_id: string): Promise<void>;
  sendWalletAccountMetrics(wallet_id: string, wallet_account_id: string, has_positive_balance: boolean): Promise<void>;
  setWalletTransactionFlag(wallet_id: string, wallet_account_id: string, wallet_transaction_id: string, flag: WasmWalletTransactionFlag): Promise<WasmApiWalletTransactionData>;
  updateWalletAccountLabel(wallet_id: string, wallet_account_id: string, label: string): Promise<WasmWalletAccountData>;
  disableShowWalletRecovery(wallet_id: string): Promise<void>;
  getWalletAccountAddresses(wallet_id: string, wallet_account_id: string): Promise<WasmApiWalletAccountAddresses>;
  updateWalletAccountsOrder(wallet_id: string, wallet_account_ids: string[]): Promise<WasmApiWalletAccounts>;
  deleteWalletTransactionFlag(wallet_id: string, wallet_account_id: string, wallet_transaction_id: string, flag: WasmWalletTransactionFlag): Promise<WasmApiWalletTransactionData>;
  updateWalletAccountStopGap(wallet_id: string, wallet_account_id: string, stop_gap: number): Promise<WasmWalletAccountData>;
  getWalletTransactionsToHash(wallet_id: string, wallet_account_id?: string | null): Promise<WasmApiWalletTransactions>;
  updateWalletTransactionLabel(wallet_id: string, wallet_account_id: string, wallet_transaction_id: string, label: string): Promise<WasmApiWalletTransactionData>;
  updateWalletAccountFiatCurrency(wallet_id: string, wallet_account_id: string, symbol: WasmFiatCurrencySymbol): Promise<WasmWalletAccountData>;
  updateWalletAccountLastUsedIndex(wallet_id: string, wallet_account_id: string, last_used_index: number): Promise<WasmWalletAccountData>;
  updateWalletTransactionHashedTxId(wallet_id: string, wallet_account_id: string, wallet_transaction_id: string, hash_txid: string): Promise<WasmApiWalletTransactionData>;
  updateExternalWalletTransactionSender(wallet_id: string, wallet_account_id: string, wallet_transaction_id: string, sender: string): Promise<WasmApiWalletTransactionData>;
  migrate(wallet_id: string, migrated_wallet: WasmMigratedWallet, migrated_wallet_accounts: WasmMigratedWalletAccounts, migrated_wallet_transactions: WasmMigratedWalletTransactions): Promise<void>;
}
export class WasmWrappedPriceGraph {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  data: WasmPriceGraph;
}

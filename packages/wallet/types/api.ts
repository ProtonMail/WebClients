// This file defines interfaces for model received from Wallet API
import { WasmBitcoinUnit, WasmScriptType } from '@proton/andromeda';

export enum WalletPassphrase {
    WithoutPassphrase = 0,
    WithPassphrase = 1,
}

export enum WalletSetupMode {
    Created = 0,
    Imported = 1,
}

export enum WalletStatus {
    Active = 1,
    Disabled = 2,
}

export enum WalletType {
    OnChain = 1,
    Lightning = 2,
}

export interface Wallet {
    // Autoincrement ID
    WalletID: number;
    // UserID owning the wallet
    UserID: number;
    // Name for the wallet
    Name: string;
    // Encrypted version of the mnemonic with the wallet key
    Mnemonic: string;
    // 0 = no passphrase, 1 = require passphrase
    Passphrase: WalletPassphrase;
    // Encrypted version of the public key with the wallet key, only used if wallet got imported with public key. In this case, it is a watch-only wallet and transaction broadcast route becomes unavailable.
    PublicKey?: string;
    // 0 = created by Proton, 1 = imported wallet
    Imported: WalletSetupMode;
    // Define wallet priority (1 is the primary wallet)
    Priority: number;
    // 1 = Active, 2 = Disabled
    Status: number;
    // Type of wallet (1 = On-chain, 2 = Lightning)
    Type: WalletType;
    // Creation time
    CreateTime: number;
    // Time of last update
    ModifyTime: number;
}

export interface WalletKey {
    // Autoincrement ID
    WalletKeyID: number;
    // WalletID owning the wallet key
    WalletID: number;
    // AES-GCM 256 bits symmetrical key encrypted with the account key
    WalletKey: string;
    // UserKeyID used to encrypt the WalletKey
    UserKeyId: number;
    // Creation time
    CreateTime: number;
    // Time of last update
    ModifyTime: number;
}

export interface WalletSettings {
    // WalletID owning the settings
    WalletID: number;
    // Hide accounts, only used for on-chain wallet
    HideAccounts: number;
    // Default description, only used for lightning wallet
    InvoiceDefaultDescription: string;
    // Default lightning invoice expiration time in seconds
    InvoiceExpirationTime: number;
    //
    MaxChannelOpeningFee: number;
    // Creation time
    CreateTime: number;
    // Time of last update
    ModifyTime: number;
}

export interface UserWalletSettings {
    // Primary key
    UserID: number;
    // Request 2FA for any amount above this threshold in sats
    TwoFactorAmountThreshold: number;
    // Hide empty used addresses
    HideEmptyUsedAddresses: number;
    // CurrencyID of the wallet
    FiatCurrencyID: number;
    // BitcoinUnitID of the wallet
    BitcoinUnitID: number;
    // Creation time
    CreateTime: number;
    // Time of last update
    ModifyTime: number;
}

export interface WalletAccount {
    // Autoincrement ID
    WalletAccountID: number;
    // WalletID owning the account
    WalletID: number;
    // Account index, used to get derivation path
    Index: number;
    // Encrypted version of the label of the account with the wallet key
    Label: string;
    // Type of accounts
    ScriptType: WasmScriptType;
    // Creation time
    CreateTime: number;
    // Time of last update
    ModifyTime: number;
}

export interface Transaction {
    // Autoincrement ID
    TransactionLabelID: number;
    // WalletID
    WalletID: number;
    // Encrypted version of the transaction label with the wallet key
    Label: string;
    // Encrypted version of the identification number for a bitcoin transaction with the wallet key
    TxID: number;
    // Creation time
    CreateTime: number;
    // Time of last update
    ModifyTime: number;
}

export interface BitcoinUnit {
    // Autoincrement ID
    BitcoinUnitID: number;
    // Name of the Bitcoin unit (e.g. satoshi, bitcoin)
    Name: string;
    // Symbol of the currency (e.g. sats and btc)
    Symbol: WasmBitcoinUnit;
}

export interface FiatCurrency {
    // Autoincrement ID
    FiatCurrencyID: number;
    // Name of the fiat currency (e.g. euro)
    Name: string;
    // Symbol of the currency (e.g. EUR)
    Symbol: string;
}

export type ApiWallet = Wallet & { accounts: WalletAccount[]; settings: WalletSettings; key: WalletKey };

import {
    Wallet as ApiWallet,
    BitcoinUnit,
    FiatCurrency,
    ScriptType,
    UserWalletSettings,
    WalletAccount,
    WalletKey,
    WalletPassphrase,
    WalletSettings,
    WalletSetupMode,
    WalletStatus,
    WalletType,
} from '../../types/api';

/**
 * Fixtures used to mock api while it is being implemented
 */

const walletOne: ApiWallet = {
    WalletID: 0,
    UserID: 999,
    Name: 'Bitcoin 01',
    // TODO should be encrypted when comin from server
    Mnemonic:
        'category law logic swear involve banner pink room diesel fragile sunset remove whale lounge captain code hobby lesson material current moment funny vast fade',
    Passphrase: WalletPassphrase.WithoutPassphrase,
    Imported: WalletSetupMode.Created,
    Priority: 1,
    Status: WalletStatus.Active,
    Type: WalletType.OnChain,
    CreateTime: 1701149748899,
    ModifyTime: 1701169836899,
};

const walletTwo: ApiWallet = {
    WalletID: 1,
    UserID: 999,
    Name: 'Savings on Jade',
    // TODO should be encrypted when comin from server
    Mnemonic: 'desk prevent enhance husband hungry idle member vessel room moment simple behave',
    Passphrase: WalletPassphrase.WithoutPassphrase,
    Imported: WalletSetupMode.Created,
    Priority: 2,
    Status: WalletStatus.Active,
    Type: WalletType.OnChain,
    CreateTime: 1701159393899,
    ModifyTime: 1701159355899,
};

// TODO: either support or reject Electrum seeds (BIP39 alternative)
const walletThree: ApiWallet = {
    WalletID: 2,
    UserID: 999,
    Name: 'Savings on Electrum',
    // TODO should be encrypted when comin from server
    Mnemonic: 'excite escape obscure gesture perfect depth roof until virtual knee garbage moment',
    Passphrase: WalletPassphrase.WithoutPassphrase,
    Imported: WalletSetupMode.Created,
    Priority: 2,
    Status: WalletStatus.Active,
    Type: WalletType.OnChain,
    CreateTime: 1701139393899,
    ModifyTime: 1701153355899,
};

const walletKeyOne: WalletKey = {
    WalletKeyID: 3,
    WalletID: 0,
    WalletKey: '',
    UserKeyId: 998,
    CreateTime: 1701139393899,
    ModifyTime: 1701139393899,
};

const walletKeyTwo: WalletKey = {
    WalletKeyID: 4,
    WalletID: 1,
    WalletKey: '',
    UserKeyId: 998,
    CreateTime: 1701139393899,
    ModifyTime: 1701139393899,
};

const walletKeyThree: WalletKey = {
    WalletKeyID: 5,
    WalletID: 2,
    WalletKey: '',
    UserKeyId: 998,
    CreateTime: 1701139393899,
    ModifyTime: 1701139393899,
};

const walletSettingsOne: WalletSettings = {
    WalletID: 0,
    HideAccounts: 0,
    InvoiceDefaultDescription: '',
    InvoiceExpirationTime: 3600,
    MaxChannelOpeningFee: 5000,
    CreateTime: 1701139393899,
    ModifyTime: 1701139393899,
};

const walletSettingsTwo: WalletSettings = {
    WalletID: 1,
    HideAccounts: 0,
    InvoiceDefaultDescription: '',
    InvoiceExpirationTime: 3600,
    MaxChannelOpeningFee: 5000,
    CreateTime: 1701139393899,
    ModifyTime: 1701139393899,
};

const walletSettingsThree: WalletSettings = {
    WalletID: 2,
    HideAccounts: 0,
    InvoiceDefaultDescription: '',
    InvoiceExpirationTime: 3600,
    MaxChannelOpeningFee: 5000,
    CreateTime: 1701139393899,
    ModifyTime: 1701139393899,
};

export const walletUserSettings: UserWalletSettings = {
    UserID: 999,
    TwoFactorAmountThreshold: 100000,
    HideEmptyUsedAddresses: 1,
    ShowWalletRecovery: 1,
    FiatCurrencyID: 6,
    BitcoinUnitID: 7,
    CreateTime: 1701139393899,
    ModifyTime: 1701139393899,
};

const walletAccountOneA: WalletAccount = {
    WalletAccountID: 8,
    WalletID: 0,
    Index: 0,
    Label: 'Account 1',
    ScriptType: ScriptType.NativeSegwit,
    CreateTime: 1701139393899,
    ModifyTime: 1701139393899,
};

const walletAccountOneB: WalletAccount = {
    WalletAccountID: 9,
    WalletID: 0,
    Index: 2,
    Label: 'Account 2',
    ScriptType: ScriptType.NativeSegwit,
    CreateTime: 1701139393899,
    ModifyTime: 1701139393899,
};

const walletAccountTwoA: WalletAccount = {
    WalletAccountID: 10,
    WalletID: 1,
    Index: 0,
    Label: 'Main account',
    ScriptType: ScriptType.NestedSegwit,
    CreateTime: 1701139393899,
    ModifyTime: 1701139393899,
};

const walletAccountTwoB: WalletAccount = {
    WalletAccountID: 11,
    WalletID: 1,
    Index: 0,
    Label: 'Segwit Account',
    ScriptType: ScriptType.NativeSegwit,
    CreateTime: 1701139393899,
    ModifyTime: 1701139393899,
};

const walletAccountThree: WalletAccount = {
    WalletAccountID: 12,
    WalletID: 2,
    Index: 0,
    Label: 'Electrum account',
    ScriptType: ScriptType.NativeSegwit,
    CreateTime: 1701139393899,
    ModifyTime: 1701139393899,
};

export const wallets = [
    { ...walletOne, accounts: [walletAccountOneA, walletAccountOneB], settings: walletSettingsOne, key: walletKeyOne },
    { ...walletTwo, accounts: [walletAccountTwoA, walletAccountTwoB], settings: walletSettingsTwo, key: walletKeyTwo },
    { ...walletThree, accounts: [walletAccountThree], settings: walletSettingsThree, key: walletKeyThree },
];

const bitcoinUnitA: BitcoinUnit = {
    BitcoinUnitID: 13,
    Name: 'bitcoin',
    Symbol: 'BTC',
};

const bitcoinUnitB: BitcoinUnit = {
    BitcoinUnitID: 14,
    Name: 'satoshi',
    Symbol: 'SATS',
};

const bitcoinUnitC: BitcoinUnit = {
    BitcoinUnitID: 15,
    Name: 'millibitcoin',
    Symbol: 'mBTC',
};

export const bitcoinUnits = [bitcoinUnitA, bitcoinUnitB, bitcoinUnitC];

const fiatCurrencyA: FiatCurrency = {
    FiatCurrencyID: 16,
    Name: 'Euro',
    Symbol: 'EUR',
};

const fiatCurrencyB: FiatCurrency = {
    FiatCurrencyID: 17,
    Name: 'Swiss Franc',
    Symbol: 'CHF',
};

const fiatCurrencyC: FiatCurrency = {
    FiatCurrencyID: 18,
    Name: 'US Dollar',
    Symbol: 'USD',
};

export const fiatCurrencies = [fiatCurrencyA, fiatCurrencyB, fiatCurrencyC];

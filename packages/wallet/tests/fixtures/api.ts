import {
    WasmApiExchangeRate,
    WasmApiWallet,
    WasmApiWalletAccount,
    WasmApiWalletKey,
    WasmApiWalletSettings,
    WasmScriptType,
    WasmUserSettings,
} from '@proton/andromeda';

import {
    BitcoinUnit,
    FiatCurrency,
    IWasmApiWalletData,
    UserWalletSettings,
    Wallet,
    WalletPassphrase,
    WalletSetupMode,
    WalletStatus,
    WalletType,
} from '../../types';

/**
 * Fixtures used to mock api while it is being implemented
 */

export const emptyWallet: Wallet = {
    WalletID: 81772,
    UserID: 999,
    Name: 'Bitcoin empty 01',
    // TODO should be encrypted when comin from server
    Mnemonic: 'benefit indoor helmet wine exist height grain spot rely half beef nothing',
    Passphrase: WalletPassphrase.WithoutPassphrase,
    Imported: WalletSetupMode.Created,
    Priority: 1,
    Status: WalletStatus.Active,
    Type: WalletType.OnChain,
    CreateTime: 1701149748899,
    ModifyTime: 1701169836899,
};

const apiWalletOne: WasmApiWallet = {
    ID: '0',
    Name: 'Bitcoin 01',
    // TODO should be encrypted when comin from server
    Mnemonic:
        'category law logic swear involve banner pink room diesel fragile sunset remove whale lounge captain code hobby lesson material current moment funny vast fade',
    HasPassphrase: WalletPassphrase.WithoutPassphrase,
    IsImported: WalletSetupMode.Created,
    Priority: 1,
    Status: WalletStatus.Active,
    Type: WalletType.OnChain,
    Fingerprint: null,
    PublicKey: null,
};

const apiWalletTwo: WasmApiWallet = {
    ID: '1',
    Name: 'Savings on Jade',
    // TODO should be encrypted when comin from server
    Mnemonic: 'desk prevent enhance husband hungry idle member vessel room moment simple behave',
    HasPassphrase: WalletPassphrase.WithoutPassphrase,
    IsImported: WalletSetupMode.Created,
    Priority: 2,
    Status: WalletStatus.Active,
    Type: WalletType.OnChain,
    Fingerprint: null,
    PublicKey: null,
};

// TODO: either support or reject Electrum seeds (BIP39 alternative)
const apiWalletThree: WasmApiWallet = {
    ID: '2',
    Name: 'Savings on Electrum',
    // TODO should be encrypted when comin from server
    Mnemonic: 'cheap venue peace soup arrest abuse obtain flip census smile game evidence advice ceiling capital',
    HasPassphrase: WalletPassphrase.WithoutPassphrase,
    IsImported: WalletSetupMode.Created,
    Priority: 2,
    Status: WalletStatus.Active,
    Type: WalletType.OnChain,
    Fingerprint: null,
    PublicKey: null,
};

const apiWalletKeyOne: WasmApiWalletKey = {
    WalletID: '0',
    UserKeyID: '998',
    WalletKey: '3',
    WalletKeySignature: '"-----BEGIN PGP SIGNATURE-----.*-----END PGP SIGNATURE-----"',
};

const apiWalletKeyTwo: WasmApiWalletKey = {
    WalletID: '1',
    UserKeyID: '998',
    WalletKey: '1',
    WalletKeySignature: '"-----BEGIN PGP SIGNATURE-----.*-----END PGP SIGNATURE-----"',
};

const apiWalletKeyThree: WasmApiWalletKey = {
    WalletID: '2',
    UserKeyID: '998',
    WalletKey: '2',
    WalletKeySignature: '"-----BEGIN PGP SIGNATURE-----.*-----END PGP SIGNATURE-----"',
};

const apiWalletSettingsOne: WasmApiWalletSettings = {
    WalletID: '0',
    HideAccounts: 0,
    InvoiceDefaultDescription: '',
    InvoiceExpirationTime: 3600,
    MaxChannelOpeningFee: 5000,
    ShowWalletRecovery: false,
};

const apiWalletSettingsTwo: WasmApiWalletSettings = {
    WalletID: '1',
    HideAccounts: 0,
    InvoiceDefaultDescription: '',
    InvoiceExpirationTime: 3600,
    MaxChannelOpeningFee: 5000,
    ShowWalletRecovery: false,
};

const apiWalletSettingsThree: WasmApiWalletSettings = {
    WalletID: '2',
    HideAccounts: 0,
    InvoiceDefaultDescription: '',
    InvoiceExpirationTime: 3600,
    MaxChannelOpeningFee: 5000,
    ShowWalletRecovery: false,
};

export const apiWalletUserSettings: UserWalletSettings = {
    UserID: 999,
    TwoFactorAmountThreshold: 100000,
    HideEmptyUsedAddresses: 1,
    FiatCurrencyID: 6,
    BitcoinUnitID: 7,
    CreateTime: 1701139393899,
    ModifyTime: 1701139393899,
};

export const apiWalletAccountOneA: WasmApiWalletAccount = {
    ID: '8',
    WalletID: '0',
    Label: 'Account 1',
    ScriptType: WasmScriptType.NativeSegwit,
    DerivationPath: "84'/0'/0'",
    Addresses: [],
    FiatCurrency: 'USD',
};

export const apiWalletAccountOneB: WasmApiWalletAccount = {
    ID: '9',
    WalletID: '0',
    Label: 'Account 2',
    ScriptType: WasmScriptType.Taproot,
    DerivationPath: "86'/0'/0'",
    Addresses: [],
    FiatCurrency: 'USD',
};

export const apiWalletAccountTwoA: WasmApiWalletAccount = {
    ID: '10',
    WalletID: '1',
    Label: 'Main account',
    ScriptType: WasmScriptType.NestedSegwit,
    DerivationPath: "49'/0'/0'",
    Addresses: [],
    FiatCurrency: 'USD',
};

export const apiWalletAccountTwoB: WasmApiWalletAccount = {
    ID: '11',
    WalletID: '1',
    Label: 'Electrum account',
    ScriptType: WasmScriptType.NativeSegwit,
    DerivationPath: "84'/0'/0'",
    Addresses: [],
    FiatCurrency: 'USD',
};

export const apiWalletAccountThree: WasmApiWalletAccount = {
    ID: '12',
    WalletID: '2',
    Label: 'Electrum account',
    ScriptType: WasmScriptType.NativeSegwit,
    DerivationPath: "84'/0'/0'",
    Addresses: [],
    FiatCurrency: 'USD',
};

export const apiWalletsData: IWasmApiWalletData[] = [
    {
        Wallet: apiWalletOne,
        WalletSettings: apiWalletSettingsOne,
        WalletKey: apiWalletKeyOne,
        WalletAccounts: [apiWalletAccountOneA, apiWalletAccountOneB],
    },
    {
        Wallet: apiWalletTwo,
        WalletSettings: apiWalletSettingsTwo,
        WalletKey: apiWalletKeyTwo,
        WalletAccounts: [apiWalletAccountTwoA, apiWalletAccountTwoB],
    },
    {
        Wallet: apiWalletThree,
        WalletSettings: apiWalletSettingsThree,
        WalletKey: apiWalletKeyThree,
        WalletAccounts: [apiWalletAccountThree],
    },
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
    Symbol: 'MBTC',
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

export const exchangeRate: WasmApiExchangeRate = {
    ID: 'o-xIOVxd5mY7mOZz4UC9eZ70uSBWTSRwHxLPgoAMv5W9CSvp--SVhzZHL_8Id3YCgPV_RiUzVRNoV7K0gaOPeA==',
    BitcoinUnit: 'BTC',
    FiatCurrency: 'USD',
    ExchangeRateTime: '2024-03-07T07:01:06+00:00',
    ExchangeRate: 365760,
    Cents: 100,
};

export const userWalletSettings: WasmUserSettings = {
    BitcoinUnit: 'BTC',
    FiatCurrency: 'USD',
    HideEmptyUsedAddresses: 0,
    TwoFactorAmountThreshold: null,
    ReceiveEmailIntegrationNotification: null,
    ReceiveInviterNotification: null,
    WalletCreated: null,
};

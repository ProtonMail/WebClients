import {
    WasmApiWallet,
    WasmApiWalletAccount,
    WasmApiWalletKey,
    WasmApiWalletSettings,
    WasmBitcoinUnit,
    WasmScriptType,
} from '@proton/andromeda';

import { IWasmApiWalletData } from '../../types';
import {
    BitcoinUnit,
    FiatCurrency,
    UserWalletSettings,
    Wallet,
    WalletPassphrase,
    WalletSetupMode,
    WalletStatus,
    WalletType,
} from '../../types/api';

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
    Mnemonic: 'excite escape obscure gesture perfect depth roof until virtual knee garbage moment',
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
};

const apiWalletKeyTwo: WasmApiWalletKey = {
    WalletID: '1',
    UserKeyID: '998',
    WalletKey: '1',
};

const apiWalletKeyThree: WasmApiWalletKey = {
    WalletID: '2',
    UserKeyID: '998',
    WalletKey: '2',
};

const apiWalletSettingsOne: WasmApiWalletSettings = {
    WalletID: '0',
    HideAccounts: 0,
    InvoiceDefaultDescription: '',
    InvoiceExpirationTime: 3600,
    MaxChannelOpeningFee: 5000,
};

const apiWalletSettingsTwo: WasmApiWalletSettings = {
    WalletID: '1',
    HideAccounts: 0,
    InvoiceDefaultDescription: '',
    InvoiceExpirationTime: 3600,
    MaxChannelOpeningFee: 5000,
};

const apiWalletSettingsThree: WasmApiWalletSettings = {
    WalletID: '2',
    HideAccounts: 0,
    InvoiceDefaultDescription: '',
    InvoiceExpirationTime: 3600,
    MaxChannelOpeningFee: 5000,
};

export const apiWalletUserSettings: UserWalletSettings = {
    UserID: 999,
    TwoFactorAmountThreshold: 100000,
    HideEmptyUsedAddresses: 1,
    ShowWalletRecovery: 1,
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
    DerivationPath: "m/84'/0'/0'",
};

export const apiWalletAccountOneB: WasmApiWalletAccount = {
    ID: '9',
    WalletID: '0',
    Label: 'Account 2',
    ScriptType: WasmScriptType.Taproot,
    DerivationPath: "m/86'/0'/0'",
};

export const apiWalletAccountTwoA: WasmApiWalletAccount = {
    ID: '10',
    WalletID: '1',
    Label: 'Main account',
    ScriptType: WasmScriptType.NestedSegwit,
    DerivationPath: "m/49'/0'/0'",
};

export const apiWalletAccountTwoB: WasmApiWalletAccount = {
    ID: '11',
    WalletID: '1',
    Label: 'Electrum account',
    ScriptType: WasmScriptType.NativeSegwit,
    DerivationPath: "m/84'/0'/0'",
};

export const apiWalletAccountThree: WasmApiWalletAccount = {
    ID: '12',
    WalletID: '2',
    Label: 'Electrum account',
    ScriptType: WasmScriptType.NativeSegwit,
    DerivationPath: "m/84'/0'/0'",
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
    Symbol: WasmBitcoinUnit.BTC,
};

const bitcoinUnitB: BitcoinUnit = {
    BitcoinUnitID: 14,
    Name: 'satoshi',
    Symbol: WasmBitcoinUnit.SAT,
};

const bitcoinUnitC: BitcoinUnit = {
    BitcoinUnitID: 15,
    Name: 'millibitcoin',
    Symbol: WasmBitcoinUnit.MBTC,
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

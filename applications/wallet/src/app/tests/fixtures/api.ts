import { WasmApiWallet, WasmBitcoinUnit, WasmScriptType, WasmWalletAccount, WasmWalletKey } from '../../../pkg';
import { IWasmWallet } from '../../types';
import {
    BitcoinUnit,
    FiatCurrency,
    UserWalletSettings,
    Wallet,
    WalletPassphrase,
    WalletSettings,
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

const walletOne: WasmApiWallet = {
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

const walletTwo: WasmApiWallet = {
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
const walletThree: WasmApiWallet = {
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

const walletKeyOne: WasmWalletKey = {
    UserKeyID: '998',
    WalletKey: '3',
};

const walletKeyTwo: WasmWalletKey = {
    UserKeyID: '998',
    WalletKey: '1',
};

const walletKeyThree: WasmWalletKey = {
    UserKeyID: '998',
    WalletKey: '2',
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

export const walletAccountOneA: WasmWalletAccount = {
    ID: '8',
    Label: 'Account 1',
    ScriptType: WasmScriptType.NativeSegwit,
    DerivationPath: "m/84'/0'/0'",
};

export const walletAccountOneB: WasmWalletAccount = {
    ID: '9',
    Label: 'Account 2',
    ScriptType: WasmScriptType.NativeSegwit,
    DerivationPath: "m/84'/0'/1'",
};

export const walletAccountOneC: WasmWalletAccount = {
    ID: '91',
    Label: 'Account 2',
    ScriptType: WasmScriptType.Taproot,
    DerivationPath: "m/86'/0'/0'",
};

export const walletAccountTwoA: WasmWalletAccount = {
    ID: '10',
    Label: 'Main account',
    ScriptType: WasmScriptType.NestedSegwit,
    DerivationPath: "m/49'/0'/0'",
};

export const walletAccountTwoB: WasmWalletAccount = {
    ID: '11',
    Label: 'Electrum account',
    ScriptType: WasmScriptType.NativeSegwit,
    DerivationPath: "m/84'/0'/0'",
};

export const walletAccountThree: WasmWalletAccount = {
    ID: '12',
    Label: 'Electrum account',
    ScriptType: WasmScriptType.NativeSegwit,
    DerivationPath: "m/84'/0'/0'",
};

export const wallets: IWasmWallet[] = [
    {
        Wallet: walletOne,
        // ...emptyWallet,
        // accounts: [walletAccountOneA, walletAccountOneB, walletAccountOneC],
        WalletSettings: walletSettingsOne,
        WalletKey: walletKeyOne,
        WalletAccounts: [],
    },
    {
        Wallet: walletTwo,
        // accounts: [walletAccountTwoA, walletAccountTwoB],
        WalletSettings: walletSettingsTwo,
        WalletKey: walletKeyTwo,
        WalletAccounts: [],
    },
    {
        Wallet: walletThree,
        // accounts: [walletAccountThree],
        WalletSettings: walletSettingsThree,
        WalletKey: walletKeyThree,
        WalletAccounts: [],
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

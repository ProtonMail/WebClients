import type { WasmAccount, WasmApiWalletAccount, WasmWallet } from '@proton/andromeda';
import { type IWasmApiWalletData } from '@proton/wallet';

export type AccountWithChainData = {
    account: WasmAccount;
    scriptType: number;
    derivationPath: string;
};

export type AccountChainDataByAccountId = Partial<Record<string, AccountWithChainData>>;
export type AccountIdByDerivationPathAndWalletId = Partial<Record<string, Partial<Record<string, string>>>>;

export type WalletWithChainData = {
    wallet: WasmWallet;
    accounts: AccountChainDataByAccountId;
};

export type WalletChainDataByWalletId = Partial<Record<string, WalletWithChainData>>;

export type WalletMap = Partial<
    Record<string, { wallet: IWasmApiWalletData; accounts: Partial<Record<string, WasmApiWalletAccount>> }>
>;

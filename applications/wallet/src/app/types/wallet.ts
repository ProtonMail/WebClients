import type { WasmAccount, WasmApiWalletAccount, WasmWallet } from '@proton/andromeda';
import { type SimpleMap } from '@proton/shared/lib/interfaces';
import { type IWasmApiWalletData } from '@proton/wallet';

export type AccountWithChainData = {
    account: WasmAccount;
    scriptType: number;
    derivationPath: string;
    poolSize: number;
};

export type AccountChainDataByAccountId = SimpleMap<AccountWithChainData>;
export type AccountIdByDerivationPathAndWalletId = SimpleMap<SimpleMap<string>>;

export type WalletWithChainData = {
    wallet: WasmWallet;
    accounts: AccountChainDataByAccountId;
};

export type WalletChainDataByWalletId = SimpleMap<WalletWithChainData>;

export type WalletMap = SimpleMap<{ wallet: IWasmApiWalletData; accounts: SimpleMap<WasmApiWalletAccount> }>;

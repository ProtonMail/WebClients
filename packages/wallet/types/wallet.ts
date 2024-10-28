import type { WasmAccount, WasmWallet } from '@proton/andromeda';
import { type SimpleMap } from '@proton/shared/lib/interfaces';

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

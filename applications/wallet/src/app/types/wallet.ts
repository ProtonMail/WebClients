import { WalletKind } from './walletKind';

export interface Wallet {
    kind: WalletKind;
    name: string;
    id: string;
    balance: number;
}

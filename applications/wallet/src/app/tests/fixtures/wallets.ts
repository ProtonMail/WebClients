import { Wallet, WalletKind } from '../../types';

export const wallets: Wallet[] = [
    { kind: WalletKind.LIGHTNING, name: 'lightning 01', id: '0', balance: 100067 },
    { kind: WalletKind.ONCHAIN, name: 'Bitcoin 01', id: '1', balance: 11783999 },
    { kind: WalletKind.ONCHAIN, name: 'Bitcoin 02', id: '2', balance: 97536 },
    { kind: WalletKind.ONCHAIN, name: 'Bitcoin 03', id: '3', balance: 8287263 },
    { kind: WalletKind.LIGHTNING, name: 'Lightning 02', id: '4', balance: 2612374 },
];

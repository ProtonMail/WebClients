import type { ReactNode } from 'react';

export interface WalletClient {
    title: string;
    link?: string;
    icon: 'brand-windows' | 'brand-android' | 'brand-apple' | 'brand-mac';
    items?: ReactNode[];
}

export enum WalletClientKeys {
    iOS,
    Android,
}

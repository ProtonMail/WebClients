export * from './api';
export * from './eventLoop';
export * from './wasm';

export interface WalletClient {
    title: string;
    link: string;
    icon: 'brand-windows' | 'brand-android' | 'brand-apple' | 'brand-mac';
}

export enum WalletClientKeys {
    iOS,
    Android,
    macOS,
    Windows,
}

import { SharesKeysProvider } from './useSharesKeys';

export * from './interface';
export * from './shareUrl';
export * from './utils';
export { default as useDefaultShare } from './useDefaultShare';

export function SharesProvider({ children }: { children: React.ReactNode }) {
    return <SharesKeysProvider>{children}</SharesKeysProvider>;
}

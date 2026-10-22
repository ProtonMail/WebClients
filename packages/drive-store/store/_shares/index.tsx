import { SharesKeysProvider } from './useSharesKeys';

export * from './interface';
export * from './shareUrl';
export * from './utils/getSharedWithMeMembership';

export function SharesProvider({ children }: { children: React.ReactNode }) {
    return <SharesKeysProvider>{children}</SharesKeysProvider>;
}

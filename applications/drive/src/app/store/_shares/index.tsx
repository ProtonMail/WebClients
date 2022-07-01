import { SharesKeysProvider } from './useSharesKeys';
import { SharesStateProvider } from './useSharesState';

export * from './interface';
export * from './shareUrl';
export { default as useDefaultShare } from './useDefaultShare';
export { default as usePublicShare } from './usePublicShare';
export { default as useShare } from './useShare';
export { default as useShareActions } from './useShareActions';
export { default as useShareUrl } from './useShareUrl';
export { default as useVolume } from './useVolume';
export { default as useLockedVolume } from './useLockedVolume';

export function SharesProvider({ children }: { children: React.ReactNode }) {
    return (
        <SharesStateProvider>
            <SharesKeysProvider>{children}</SharesKeysProvider>
        </SharesStateProvider>
    );
}

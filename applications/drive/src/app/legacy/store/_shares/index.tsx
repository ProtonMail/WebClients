import { SharesKeysProvider } from './useSharesKeys';

export * from './interface';
export * from './shareUrl';
export { useDefaultShare } from './useDefaultShare';
export { useDriveSharingFlags } from './useDriveSharingFlags';
export { default as useLockedVolume } from './useLockedVolume';
export { default as useShare } from './useShare';
export { default as useShareActions } from './useShareActions';
export { default as useShareUrl } from './useShareUrl';
export * from './utils';

export function SharesProvider({ children }: { children: React.ReactNode }) {
    return <SharesKeysProvider>{children}</SharesKeysProvider>;
}

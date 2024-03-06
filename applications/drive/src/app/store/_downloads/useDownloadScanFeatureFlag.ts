import { useFlag } from '@proton/components';

export const useDownloadScanFlag = () => {
    // We need to get values from hooks because otherwise we get TS error
    // > error  React Hook "useFlag" is called conditionally. React Hooks must be called in the exact same order in every component render  react-hooks/rules-of-hooks
    const scanVisable = useFlag('DriveDownloadScan');
    const scanKilled = useFlag('DriveDownloadScanDisabled');
    return scanVisable && !scanKilled;
};

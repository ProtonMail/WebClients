import useIsElectronApp from './useIsElectronApp';

const useIsInboxElectronApp = () => {
    const { isElectron, isElectronDisabled, isElectronOnMac, isElectronOnWindows, isSupportedElectronApp } =
        useIsElectronApp('DisableElectronMail');

    return { isElectron, isElectronDisabled, isElectronOnMac, isElectronOnWindows, isSupportedElectronApp };
};

export default useIsInboxElectronApp;

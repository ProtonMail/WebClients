import useIsElectronApp from './useIsElectronApp';

const useIsInboxElectronApp = () => {
    const {
        isElectron,
        isElectronDisabled,
        isElectronOnMac,
        isElectronOnWindows,
        isSupportedElectronApp,
        isElectronEnabled,
    } = useIsElectronApp('DisableElectronMail');

    return {
        isElectron,
        isElectronDisabled,
        isElectronOnMac,
        isElectronOnWindows,
        isSupportedElectronApp,
        isElectronEnabled,
    };
};

export default useIsInboxElectronApp;

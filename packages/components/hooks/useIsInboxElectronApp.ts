import useIsElectronApp from './useIsElectronApp';

const useIsInboxElectronApp = () => {
    const { isElectron, isElectronDisabled, isElectronOnMac, isElectronOnWindows } =
        useIsElectronApp('DisableElectronMail');
    return { isElectron, isElectronDisabled, isElectronOnMac, isElectronOnWindows };
};

export default useIsInboxElectronApp;

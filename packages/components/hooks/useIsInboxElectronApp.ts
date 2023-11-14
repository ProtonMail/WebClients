import useIsElectronApp from './useIsElectronApp';

const useIsInboxElectronApp = () => {
    const { isElectron, isElectronDisabled, isElectronOnMac } = useIsElectronApp('DisableElectronMail');
    return { isElectron, isElectronDisabled, isElectronOnMac };
};

export default useIsInboxElectronApp;

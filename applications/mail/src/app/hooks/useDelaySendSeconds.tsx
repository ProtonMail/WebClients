import { useMailSettings } from '@proton/components';

const useDelaySendSeconds = () => {
    const [mailSettings] = useMailSettings();
    const { DelaySendSeconds = 0 } = mailSettings || {};
    return DelaySendSeconds;
};

export default useDelaySendSeconds;

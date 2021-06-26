import { useMailSettings } from 'react-components';

const useDelaySendSeconds = () => {
    const [mailSettings] = useMailSettings();
    const { DelaySendSeconds = 0 } = mailSettings || {};
    return DelaySendSeconds;
};

export default useDelaySendSeconds;

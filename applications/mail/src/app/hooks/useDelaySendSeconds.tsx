import { useUser, useMailSettings } from 'react-components';

const useDelaySendSeconds = () => {
    const [user] = useUser();
    const [mailSettings] = useMailSettings();
    const { DelaySendSeconds = 0 } = mailSettings || {};
    return user.isPaid ? DelaySendSeconds : 0;
};

export default useDelaySendSeconds;

import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { DELAY_IN_SECONDS } from '@proton/shared/lib/mail/mailSettings';

const useDelaySendSeconds = () => {
    const [{ DelaySendSeconds = DELAY_IN_SECONDS.NONE }] = useMailSettings();
    return DelaySendSeconds;
};

export default useDelaySendSeconds;

import { DELAY_IN_SECONDS } from '@proton/shared/lib/mail/mailSettings';

import { useComposerMessageHost } from '../host/composerMessageHost';

const useDelaySendSeconds = () => {
    const { useMailSettings } = useComposerMessageHost();
    const [{ DelaySendSeconds = DELAY_IN_SECONDS.NONE }] = useMailSettings();
    return DelaySendSeconds;
};

export default useDelaySendSeconds;

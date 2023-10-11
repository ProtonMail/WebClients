import { DELAY_IN_SECONDS } from '@proton/shared/lib/mail/mailSettings';

import useMailModel from 'proton-mail/hooks/useMailModel';

const useDelaySendSeconds = () => {
    const { DelaySendSeconds = DELAY_IN_SECONDS.NONE } = useMailModel('MailSettings');
    return DelaySendSeconds;
};

export default useDelaySendSeconds;

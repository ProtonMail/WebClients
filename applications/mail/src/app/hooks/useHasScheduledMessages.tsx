import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { useMailboxCounter } from './mailboxCounter/useMailboxCounter';

const useHasScheduledMessages = () => {
    const { getLocationCount, loading } = useMailboxCounter();
    const scheduledCount = getLocationCount(MAILBOX_LABEL_IDS.SCHEDULED).Total > 0;

    return [scheduledCount, loading];
};

export default useHasScheduledMessages;

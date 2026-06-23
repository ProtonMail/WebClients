import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { useMailboxCounter } from './mailboxCounter/useMailboxCounter';

const useHasSnoozedMessages = () => {
    const { getLocationCount, loading } = useMailboxCounter();
    const snoozeCount = getLocationCount(MAILBOX_LABEL_IDS.SNOOZED).Total > 0;

    return [snoozeCount, loading];
};

export default useHasSnoozedMessages;

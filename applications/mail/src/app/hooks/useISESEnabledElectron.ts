import { useEffect, useState } from 'react';

import useIsInboxElectronApp from '@proton/components/hooks/useIsInboxElectronApp';
import { FeatureCode, useFeature } from '@proton/features';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { useMailboxCounter } from './mailboxCounter/useMailboxCounter';

/**
 * Helps determine if ES should be enabled depending on feature flag and conversation counts
 */
const useIsESEnabledElectron = () => {
    const { isElectron } = useIsInboxElectronApp();
    const { getLocationCount, loading } = useMailboxCounter();
    const { feature: inboxThreshold } = useFeature<number>(FeatureCode.ElectronESInboxThreshold);

    const [isESEnabledInbox, setIsInboxEnabledInbox] = useState(false);

    useEffect(() => {
        if (loading) {
            return;
        }

        if (!isElectron) {
            setIsInboxEnabledInbox(false);
            return;
        }

        const conversationCount = getLocationCount(MAILBOX_LABEL_IDS.INBOX);
        const threshold = inboxThreshold?.Value || 0;
        setIsInboxEnabledInbox(threshold >= conversationCount.Total);
    }, [inboxThreshold, getLocationCount, loading, isElectron]);

    return { isESEnabledInbox };
};

export default useIsESEnabledElectron;

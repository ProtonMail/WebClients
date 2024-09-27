import { useEffect, useState } from 'react';

import { FeatureCode, useFeature } from '@proton/features';
import { useConversationCounts } from '@proton/mail/counts/conversationCounts';

import useIsInboxElectronApp from './useIsInboxElectronApp';

/**
 * Helps determine if ES should be enabled depending on feature flag and conversation counts
 */
const useIsESEnabledElectron = () => {
    const { isElectron } = useIsInboxElectronApp();
    const [conversationCounts] = useConversationCounts();
    const { feature: inboxThreshold } = useFeature<number>(FeatureCode.ElectronESInboxThreshold);

    const [isESEnabledInbox, setIsInboxEnabledInbox] = useState(false);

    useEffect(() => {
        if (!conversationCounts || !isElectron) {
            setIsInboxEnabledInbox(false);
            return;
        }

        const { Total } = conversationCounts.find((count) => count.LabelID === '0') ?? {};
        if (typeof Total === 'undefined') {
            setIsInboxEnabledInbox(false);
            return;
        }

        const threshold = inboxThreshold?.Value || 0;
        setIsInboxEnabledInbox(threshold >= Total);
    }, [inboxThreshold, conversationCounts]);

    return { isESEnabledInbox };
};

export default useIsESEnabledElectron;

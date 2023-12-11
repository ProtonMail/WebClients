import { useEffect, useState } from 'react';

import { FeatureCode } from '../containers';
import { useConversationCounts } from './useConversationCounts';
import useFeature from './useFeature';
import useIsInboxElectronApp from './useIsInboxElectronApp';

/**
 * Helps determine if ES should be enabled depending on feature flag and conversation counts
 */
const useIsESEnabledElectron = () => {
    const { isElectron } = useIsInboxElectronApp();
    const [conversationCounts] = useConversationCounts();
    const { feature: inboxThreshold } = useFeature(FeatureCode.ElectronESInboxThreshold);

    const [isESEnabledInbox, setIsInboxEnabledInbox] = useState(false);

    useEffect(() => {
        if (!conversationCounts || !isElectron) {
            setIsInboxEnabledInbox(false);
            return;
        }

        const { Total } = conversationCounts.find((count) => count.LabelID === '0') ?? { Total: undefined };

        if (typeof Total === 'undefined') {
            setIsInboxEnabledInbox(false);
            return;
        }

        setIsInboxEnabledInbox(inboxThreshold?.Value >= Total);
    }, [inboxThreshold, conversationCounts]);

    return { isESEnabledInbox };
};

export default useIsESEnabledElectron;

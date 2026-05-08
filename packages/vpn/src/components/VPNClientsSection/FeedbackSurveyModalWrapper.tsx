import type { PropsWithChildren } from 'react';

import { useFlag } from '@proton/unleash/useFlag';

// TODO: Remove the wrapper when the feature flag is no longer needed
export const FeedbackSurveyModalWrapper = ({ children }: PropsWithChildren) => {
    const isPurchaseAttributionSurveyEnabled = useFlag('PurchaseAttributionSurveyEnabled');
    return isPurchaseAttributionSurveyEnabled ? children : null;
};

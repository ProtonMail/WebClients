import { useCallback, useState } from 'react';

import { useIsDesktopOnboardingBlocking } from '../../features/desktopOnboarding/DesktopOnboardingProvider';
import SurveyPanel from '../../features/notification/SurveyPanel';
import { useShouldShowSurvey } from '../../hooks/useShouldShowSurvey';

interface ConversationSurveyProps {
    isGenerating?: boolean;
}

export const ConversationSurvey = ({ isGenerating }: ConversationSurveyProps) => {
    const [surveyDismissed, setSurveyDismissed] = useState(false);

    const { shouldShowSurvey, dismissSurvey } = useShouldShowSurvey();
    const isDesktopOnboardingBlocking = useIsDesktopOnboardingBlocking();

    const handleSurveyDismiss = useCallback(() => {
        setSurveyDismissed(true);
        dismissSurvey();
    }, [dismissSurvey]);

    if (!shouldShowSurvey || surveyDismissed || isGenerating || isDesktopOnboardingBlocking) {
        return null;
    }

    return (
        <div
            className="lumo-chat-item flex flex-column w-full max-w-custom mx-auto mb-4 no-print"
            style={{ '--max-w-custom': '45rem' }}
        >
            <SurveyPanel onDismiss={handleSurveyDismiss} />
        </div>
    );
};

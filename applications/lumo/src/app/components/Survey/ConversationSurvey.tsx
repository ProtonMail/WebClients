import { useCallback, useState } from 'react';

import SurveyPanel from '../../features/notification/SurveyPanel';
import { useShouldShowSurvey } from '../../hooks/useShouldShowSurvey';

interface ConversationSurveyProps {
    isGenerating?: boolean;
}

export const ConversationSurvey = ({ isGenerating }: ConversationSurveyProps) => {
    const [surveyDismissed, setSurveyDismissed] = useState(false);

    const { shouldShowSurvey, dismissSurvey } = useShouldShowSurvey();

    const handleSurveyDismiss = useCallback(() => {
        setSurveyDismissed(true);
        dismissSurvey();
    }, [dismissSurvey]);

    if (!shouldShowSurvey || surveyDismissed || isGenerating) {
        return null;
    }

    return (
        <div className="lumo-chat-item flex flex-column w-full md:w-2/3 mx-auto max-w-custom no-print mb-4">
            <SurveyPanel onDismiss={handleSurveyDismiss} />
        </div>
    );
};

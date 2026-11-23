import { useCallback } from 'react';

import { Button } from '@proton/atoms/Button/Button';

import { useConversationActions } from '../../../../../providers/ConversationActionsProvider';
import { useWebSearch } from '../../../../../providers/WebSearchProvider';

interface SuggestedQuestionsProps {
    questions: string[];
}

export const SuggestedQuestions = ({ questions }: SuggestedQuestionsProps) => {
    const { handleSendMessage } = useConversationActions();
    const { isWebSearchButtonToggled } = useWebSearch();

    const handleClick = useCallback(
        (question: string) => {
            void handleSendMessage(question, isWebSearchButtonToggled);
        },
        [handleSendMessage, isWebSearchButtonToggled]
    );

    if (!questions.length) {
        return null;
    }

    return (
        <div className="flex flex-column gap-2 mt-3">
            {questions.map((question, index) => (
                <Button
                    key={index}
                    dir="auto"
                    shape="outline"
                    size="small"
                    className="justify-start w-full p-3 lumo-body-small text-left lumo-bg-control-fill"
                    onClick={() => handleClick(question)}
                >
                    {question}
                </Button>
            ))}
        </div>
    );
};

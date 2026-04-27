import { useCallback } from 'react';

import { Button } from '@proton/atoms/Button/Button';

import { useComposerActions } from '../../../../../providers/ComposerActionsProvider';
import { useWebSearch } from '../../../../../providers/WebSearchProvider';

interface SuggestedQuestionsProps {
    questions: string[];
}

export const SuggestedQuestions = ({ questions }: SuggestedQuestionsProps) => {
    const composerActions = useComposerActions();
    const { isWebSearchButtonToggled } = useWebSearch();

    const handleClick = useCallback(
        (question: string) => {
            if (!composerActions) return;
            void composerActions.handleSendMessage(question, isWebSearchButtonToggled);
        },
        [composerActions, isWebSearchButtonToggled]
    );

    if (!questions.length || !composerActions) {
        return null;
    }

    return (
        <div className="flex flex-column gap-2 mt-3">
            {questions.map((question, index) => (
                <Button
                    key={index}
                    shape="outline"
                    size="small"
                    className="text-left text-sm w-full justify-start p-3 bg-weak"
                    onClick={() => handleClick(question)}
                >
                    {question}
                </Button>
            ))}
        </div>
    );
};

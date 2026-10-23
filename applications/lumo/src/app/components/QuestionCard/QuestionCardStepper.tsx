import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import { LumoIcon } from '../LumoIcon/LumoIcon';

interface QuestionCardStepperProps {
    /** Zero-based index of the current question. */
    currentIndex: number;
    /** Function to navigate to the next question. */
    onNext: () => void;
    /** Function to navigate to the previous question. */
    onPrevious: () => void;
    /** Total number of questions in the set. */
    total: number;
}

export const QuestionCardStepper = ({ currentIndex, onNext, onPrevious, total }: QuestionCardStepperProps) => {
    if (total <= 1) {
        return null;
    }

    const current = currentIndex + 1;

    return (
        <div className="flex flex-nowrap shrink-0 items-center text-nowrap">
            <Button
                // translator: Button to revisit the previous question.
                aria-label={c('collider_2025:Action').t`Previous question`}
                className="flex mr-1 p-0"
                disabled={currentIndex === 0}
                icon
                shape="ghost"
                size="small"
                type="button"
                onClick={onPrevious}
            >
                <LumoIcon aria-hidden="true" name="ChevronLeft" size={14} strokeWidth={1.4} />
            </Button>
            <span className="text-sm color-weak">
                {
                    // translator: Progress through a set of questions. ${current} is the current question number; ${total} is the total number of questions.
                    c('collider_2025:Label').t`${current} of ${total}`
                }
            </span>
            <Button
                // translator: Button to view the next question without submitting answers.
                aria-label={c('collider_2025:Action').t`Next question`}
                className="ml-1 p-0"
                disabled={currentIndex === total - 1}
                icon
                shape="ghost"
                size="small"
                type="button"
                onClick={onNext}
            >
                <LumoIcon aria-hidden="true" name="ChevronRight" size={14} strokeWidth={1.4} />
            </Button>
        </div>
    );
};

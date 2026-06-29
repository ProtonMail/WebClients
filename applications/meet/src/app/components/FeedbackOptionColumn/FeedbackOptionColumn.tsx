import { Button } from '@proton/atoms/Button/Button';

import './FeedbackOptionColumn.scss';

interface FeedbackOptionColumnProps {
    groupLabel: string;
    options: string[];
    selectedOptions: string[];
    onOptionSelect: (option: string) => void;
}

export const FeedbackOptionColumn = ({
    groupLabel,
    options,
    selectedOptions,
    onOptionSelect,
}: FeedbackOptionColumnProps) => {
    return (
        // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
        <div aria-label={groupLabel} className="flex flex-column gap-2 flex-1" role="group">
            {options.map((option) => {
                const isSelected = selectedOptions.includes(option);
                return (
                    <Button
                        key={option}
                        className={`feedback-option-button py-3 px-7 ${isSelected ? 'is-selected' : ''}`}
                        onClick={() => onOptionSelect(option)}
                        color="weak"
                        shape="ghost"
                        size="medium"
                        aria-pressed={isSelected}
                    >
                        {option}
                    </Button>
                );
            })}
        </div>
    );
};

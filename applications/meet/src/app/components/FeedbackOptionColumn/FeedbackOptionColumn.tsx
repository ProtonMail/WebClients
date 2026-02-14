import { Button } from '@proton/atoms/Button/Button';

import './FeedbackOptionColumn.scss';

interface FeedbackOptionColumnProps {
    options: string[];
    selectedOptions: string[];
    onOptionSelect: (option: string) => void;
}

export const FeedbackOptionColumn = ({ options, selectedOptions, onOptionSelect }: FeedbackOptionColumnProps) => {
    return (
        <div className="flex flex-column gap-2 flex-1">
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

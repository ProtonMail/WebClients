import { c } from 'ttag';

import Checkbox from '@proton/components/components/input/Checkbox';
import Radio from '@proton/components/components/input/Radio';
import { InputField } from '@proton/components/components/v2/field/InputField';

import type { QuestionCardChoiceDraft, QuestionCardChoiceQuestion } from './adapters/choiceQuestionAdapter';

import './ChoiceQuestionBody.scss';

interface ChoiceQuestionBodyProps {
    /** Stable prefix for option, hint, and custom-answer element ids (typically `useId()` from the parent card). */
    idPrefix: string;
    /** Choice question definition: options, multi-select, and optional free-text answer. */
    question: QuestionCardChoiceQuestion;
    /** Id of the visible question title. */
    titleId: string;
    /** Current selection and custom-answer text for this question. */
    value: QuestionCardChoiceDraft;
    /** Called when the user changes selected options or custom-answer text. */
    onChange: (update: Partial<QuestionCardChoiceDraft>) => void;
}

export const ChoiceQuestionBody = ({ idPrefix, question, titleId, value, onChange }: ChoiceQuestionBodyProps) => {
    const Choice = question.allowMultiple ? Checkbox : Radio;

    const handleOptionCheck = (optionId: string, checked: boolean) => {
        const optionIds = question.allowMultiple
            ? checked
                ? [...value.optionIds, optionId]
                : value.optionIds.filter((id) => id !== optionId)
            : [optionId];

        onChange({
            optionIds,
            ...(!question.allowMultiple && { customAnswerChecked: false, customAnswer: value.customAnswer }),
        });
    };

    const handleCustomAnswerCheck = (checked: boolean) => {
        onChange({
            customAnswerChecked: checked,
            ...(!question.allowMultiple && { optionIds: [] }),
        });
    };

    const handleCustomAnswerchange = (customAnswer: string) => {
        onChange({
            customAnswer,
            customAnswerChecked: true,
            ...(!question.allowMultiple && { optionIds: [] }),
        });
    };

    // translator: An accessible hint for a question that accepts multiple answers.
    const multipleAnswerInstructions = c('collider_2025:Info').t`Select all that apply.`;
    // translator: An accessible hint for a question that accepts one answer.
    const oneAnswerInstructions = c('collider_2025:Info').t`Select one answer.`;

    return (
        <fieldset
            aria-describedby={`${idPrefix}-hint`}
            aria-labelledby={titleId}
            className="choice-question-body relative flex flex-column gap-0.5 min-w-0 m-0 p-5 pt-0 border-none"
        >
            <p className="sr-only" id={`${idPrefix}-hint`}>
                {question.allowMultiple ? multipleAnswerInstructions : oneAnswerInstructions}
            </p>

            {question.options.map((option, optionIndex) => (
                <Choice
                    key={option.id}
                    aria-describedby={option.description ? `${idPrefix}-option-${optionIndex}-description` : undefined}
                    aria-labelledby={`${idPrefix}-option-${optionIndex}-label`}
                    checked={value.optionIds.includes(option.id)}
                    className="choice-question-body__option flex flex-nowrap items-center gap-4 w-full p-2 cursor-pointer"
                    id={`${idPrefix}-option-${optionIndex}`}
                    name={`${idPrefix}-answer`}
                    onChange={(event) => handleOptionCheck(option.id, event.target.checked)}
                >
                    <span className="flex flex-column flex-1 gap-0.5 min-w-0">
                        <span
                            className="choice-question-body__option-title"
                            id={`${idPrefix}-option-${optionIndex}-label`}
                        >
                            {option.label}
                        </span>
                        {option.description && (
                            <span className="text-sm color-weak" id={`${idPrefix}-option-${optionIndex}-description`}>
                                {option.description}
                            </span>
                        )}
                    </span>
                </Choice>
            ))}

            {question.allowCustomAnswer && (
                <div className="choice-question-body__option flex flex-nowrap items-center gap-4 p-2">
                    <Choice
                        // translator: Accessible label for the custom answer text field.
                        aria-label={c('collider_2025:Label').t`Your answer`}
                        checked={value.customAnswerChecked}
                        className="shrink-0"
                        id={`${idPrefix}-custom-answer-option`}
                        name={`${idPrefix}-answer`}
                        onChange={(event) => handleCustomAnswerCheck(event.target.checked)}
                    />
                    <InputField
                        assistContainerClassName="hidden"
                        id={`${idPrefix}-custom-answer`}
                        dense={true}
                        // translator: Accessible label for the custom answer text field.
                        label={c('collider_2025:Label').t`Your answer`}
                        labelContainerClassName="sr-only"
                        // translator: Placeholder and accessible name for the option that accepts a custom answer instead of a listed choice.
                        placeholder={c('collider_2025:Placeholder').t`Something else…`}
                        rootClassName="flex-1 min-w-0"
                        value={value.customAnswer}
                        onValue={handleCustomAnswerchange}
                    />
                </div>
            )}
        </fieldset>
    );
};

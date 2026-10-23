import { c, msgid } from 'ttag';

import { ChoiceQuestionBody } from '../ChoiceQuestionBody';
import type { QuestionCardAnswerBase, QuestionCardDraftData, QuestionCardQuestionBase } from '../types';
import type { QuestionCardAdapter } from './types';

/** Choice question: predefined options plus optional multi-select and free-text answer. */
export interface QuestionCardChoiceQuestion extends QuestionCardQuestionBase {
    type: 'choice';
    /** Listed options rendered as radio buttons or checkboxes. */
    options: {
        /** Stable id stored in options and submitted answers. */
        id: string;
        /** Primary label for the option control. */
        label: string;
        /** Secondary label for the option control. */
        description?: string;
    }[];
    /** When true, multiple options may be selected; otherwise single-select. */
    allowMultiple?: boolean;
    /** When true, show the "Something else..." control and custom text field. */
    allowCustomAnswer?: boolean;
}

/** In-progress answers for a choice question while the user moves through the card. */
export interface QuestionCardChoiceDraft {
    /** Ids of selected predefined options. */
    optionIds: string[];
    /** Whether the custom other option is selected. */
    customAnswerChecked: boolean;
    /** Text entered in the custom answer field. */
    customAnswer: string;
}

/** Submitted choice answer. An empty `selections` array means skipped. */
export interface QuestionCardChoiceAnswer extends QuestionCardAnswerBase {
    /** Selected option labels and custom text, in selection order. */
    selections: string[];
}

/**
 * Binds choice-specific draft handling and rendering to a question definition.
 */
export const createChoiceQuestionAdapter = (
    question: QuestionCardChoiceQuestion
): QuestionCardAdapter<Extract<QuestionCardDraftData, { type: 'choice' }>> => ({
    createInitialDraft: () => ({
        type: 'choice',
        value: { optionIds: [], customAnswerChecked: false, customAnswer: '' },
    }),
    isAnswered: ({ value }) => {
        return value.optionIds.length > 0 || (value.customAnswerChecked && value.customAnswer.trim().length > 0);
    },
    toAnswer: ({ value }) => {
        const selections = value.optionIds.flatMap((optionId) => {
            const label = question.options.find((option) => option.id === optionId)?.label;
            return label ? [label] : [];
        });
        if (value.customAnswerChecked) {
            const customAnswer = value.customAnswer.trim();
            if (customAnswer) selections.push(customAnswer);
        }

        return {
            questionId: question.id,
            selections,
        };
    },
    renderBody: ({ idPrefix, titleId, value, onChange }) => {
        return (
            <ChoiceQuestionBody
                key={question.id}
                idPrefix={idPrefix}
                question={question}
                titleId={titleId}
                value={value.value}
                onChange={(update) => onChange({ type: 'choice', value: { ...value.value, ...update } })}
            />
        );
    },
    renderStatus: (draft) => {
        const selectedCount = draft.value.optionIds.length + Number(draft.value.customAnswerChecked);
        // translator: Number of answer options selected in the current question. ${selectedCount} is the count, including a custom answer when selected.
        return c('collider_2025:Question selection').ngettext(
            msgid`${selectedCount} selected`,
            `${selectedCount} selected`,
            selectedCount
        );
    },
});

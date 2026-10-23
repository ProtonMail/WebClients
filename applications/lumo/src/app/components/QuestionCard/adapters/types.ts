import type { ReactNode } from 'react';

import type { QuestionCardAnswerData, QuestionCardDraftData } from '../types';

/** Shared inputs supplied by the card to a question-specific body renderer. */
interface QuestionBodyProps<TDraft extends QuestionCardDraftData> {
    /** Unique prefix for form-control ids within this card instance. */
    idPrefix: string;
    /** Id of the visible question heading, used to label the body accessibly. */
    titleId: string;
    /** Current draft for this question; its discriminator must match the adapter. */
    value: TDraft;
    /** Replaces the full draft for this question. */
    onChange: (value: TDraft) => void;
}

/**
 * Encapsulates a question type's input, validation, serialization, and status UI.
 * The card owns navigation and skipping without inspecting the draft's fields.
 * Each adapter is bound to one question definition, including its id and settings.
 * @typeParam TDraft - The draft variant accepted and produced by this adapter.
 */
export interface QuestionCardAdapter<TDraft extends QuestionCardDraftData = QuestionCardDraftData> {
    /** Creates a fresh, independent draft for an unvisited or newly skipped question. */
    createInitialDraft: () => TDraft;
    /**
     * Whether the draft is complete enough to submit as an answered question.
     * Incomplete drafts are treated as skipped when navigating or submitting the set.
     */
    isAnswered: (draft: TDraft) => boolean;
    /**
     * Converts a draft to its public answer, including the bound question id.
     * An initial draft must produce this question type's skipped answer.
     */
    toAnswer: (draft: TDraft) => QuestionCardAnswerData;
    /**
     * Renders this type's controls and translates input changes into complete drafts.
     * Keep React hooks in the rendered body component, not in this render callback.
     */
    renderBody: (props: QuestionBodyProps<TDraft>) => ReactNode;
    /** Renders the footer's type-specific status, or null when no status is needed. */
    renderStatus: (draft: TDraft) => ReactNode;
}

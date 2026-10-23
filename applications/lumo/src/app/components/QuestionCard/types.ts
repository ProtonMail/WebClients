import type {
    QuestionCardChoiceAnswer,
    QuestionCardChoiceDraft,
    QuestionCardChoiceQuestion,
} from './adapters/choiceQuestionAdapter';

/** Shared question metadata for every question card variant. */
export interface QuestionCardQuestionBase {
    /** Stable id used for drafts, answers, and React keys. */
    id: string;
    /** Question prompt shown in the card header. */
    title: string;
    /** Discriminator for which body renderer to mount (e.g. "choice"). */
    type: string;
}

/** Known question variants. Only choice questions have a renderer at present. */
export type QuestionCardQuestionData = QuestionCardChoiceQuestion;

/** Draft variants are paired with their question type before reaching an adapter. */
export type QuestionCardDraftData = { type: 'choice'; value: QuestionCardChoiceDraft };

/** Shared metadata for a submitted answer, independent of the question type. */
export interface QuestionCardAnswerBase {
    /** Id of the question this answer belongs to. */
    questionId: string;
}

/** Submitted answer variants for the supported question types. */
export type QuestionCardAnswerData = QuestionCardChoiceAnswer;

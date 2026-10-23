import type { QuestionCardQuestionData } from '../types';
import { createChoiceQuestionAdapter } from './choiceQuestionAdapter';
import type { QuestionCardAdapter } from './types';

/**
 * Selects an adapter from the question discriminator. When adding a question type, extend the question/draft/answer
 * unions and register its adapter here; the card's navigation and submission handlers can continue using the shared
 * contract.
 */
export const getQuestionAdapter = (question: QuestionCardQuestionData): QuestionCardAdapter => {
    switch (question.type) {
        case 'choice':
            return createChoiceQuestionAdapter(question);
    }
};

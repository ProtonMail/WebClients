import type { QuestionCardQuestionData } from '../../../components/QuestionCard/types';
import type { ClientToolSuccessResult, ValidationResult } from '../validationUtils';
import { getUnexpectedProperty, invalidArguments, isNonBlankString, isRecord } from '../validationUtils';
import type { AskUserQuestionsToolArguments } from './askUserQuestionsTool';
import { askUserQuestionsSchema } from './schema';

/**
 * Check decoded arguments before executing a call or rendering persisted questions.
 * Keep these checks aligned with the advertised schema, including unknown fields and unique ids.
 * Return the first invalid field to the model for correction without runtime code generation.
 */
export function validateAskUserQuestionsToolArguments(value: unknown): ValidationResult<AskUserQuestionsToolArguments> {
    if (!isRecord(value)) return invalidArguments('arguments: must be an object');

    const schema = askUserQuestionsSchema;
    const unexpectedProperty = getUnexpectedProperty(value, schema.properties);
    if (unexpectedProperty !== undefined) return invalidArguments(`arguments.${unexpectedProperty}: unknown field`);
    if (
        !Array.isArray(value.questions) ||
        value.questions.length < schema.properties.questions.minItems ||
        value.questions.length > schema.properties.questions.maxItems
    ) {
        return invalidArguments('questions: must contain between 1 and 5 questions');
    }

    const questionIds = new Set<string>();
    for (const [questionIndex, question] of value.questions.entries()) {
        const path = `questions[${questionIndex}]`;
        if (!isRecord(question)) return invalidArguments(`${path}: must be an object`);
        const unexpectedProperty = getUnexpectedProperty(question, schema.properties.questions.items.properties);
        if (unexpectedProperty !== undefined) return invalidArguments(`${path}.${unexpectedProperty}: unknown field`);
        if (!isNonBlankString(question.id)) return invalidArguments(`${path}.id: must be a non-blank string`);
        if (question.type !== 'choice') return invalidArguments(`${path}.type: must be "choice"`);
        if (!isNonBlankString(question.title)) return invalidArguments(`${path}.title: must be a non-blank string`);
        if (typeof question.allowMultiple !== 'boolean') {
            return invalidArguments(`${path}.allowMultiple: must be a boolean`);
        }
        if (question.allowCustomAnswer !== undefined && typeof question.allowCustomAnswer !== 'boolean') {
            return invalidArguments(`${path}.allowCustomAnswer: must be a boolean`);
        }
        if (!Array.isArray(question.options) || question.options.length === 0) {
            return invalidArguments(`${path}.options: must contain at least one option`);
        }
        if (questionIds.has(question.id)) {
            return invalidArguments(`${path}.id: duplicate question id ${JSON.stringify(question.id)}`);
        }
        questionIds.add(question.id);

        const optionIds = new Set<string>();
        for (const [optionIndex, option] of question.options.entries()) {
            const optionPath = `${path}.options[${optionIndex}]`;
            if (!isRecord(option)) return invalidArguments(`${optionPath}: must be an object`);
            const unexpectedProperty = getUnexpectedProperty(
                option,
                schema.properties.questions.items.properties.options.items.properties
            );
            if (unexpectedProperty !== undefined) {
                return invalidArguments(`${optionPath}.${unexpectedProperty}: unknown field`);
            }
            if (!isNonBlankString(option.id)) return invalidArguments(`${optionPath}.id: must be a non-blank string`);
            if (!isNonBlankString(option.label)) {
                return invalidArguments(`${optionPath}.label: must be a non-blank string`);
            }
            if (option.description !== undefined && typeof option.description !== 'string') {
                return invalidArguments(`${optionPath}.description: must be a string`);
            }
            if (optionIds.has(option.id)) {
                return invalidArguments(`${optionPath}.id: duplicate option id ${JSON.stringify(option.id)}`);
            }
            optionIds.add(option.id);
        }
    }
    // Every field has been checked above; expose the validated question type to callers.
    return { ok: true, value: { questions: value.questions as QuestionCardQuestionData[] } };
}

/** Recognize the successful acknowledgement paired with an ask_user_questions call. */
export function isAskUserQuestionsToolSuccessResult(value: unknown): value is ClientToolSuccessResult {
    return isRecord(value) && value.ok === true && typeof value.message === 'string';
}

import type { ClientToolExecutor, ClientToolResult } from '@proton/lumo-api-client/core/client-tools';
import type { ChatCompletionsFunctionTool } from '@proton/lumo-api-client/types-api';

import type { QuestionCardQuestionData } from '../../../components/QuestionCard/types';
import type { QuestionAnswer } from '../../../types';
import type { ClientToolSuccessResult } from '../validationUtils';
import { askUserQuestionsSchema } from './schema';
import { ASK_USER_QUESTIONS_INVALID_ARGUMENTS_CODE, validateAskUserQuestionsToolArguments } from './validation';

export const ASK_USER_QUESTIONS_TOOL_NAME = 'ask_user_questions';
const ASK_USER_QUESTIONS_TOOL_RESPONSE_IDENTIFIER = 'ask_user_questions_response';

/** Fully parsed tool arguments, ready to pass to QuestionCard after validation. */
export interface AskUserQuestionsToolArguments {
    questions: QuestionCardQuestionData[];
}

const askUserQuestionsTool = {
    type: 'function',
    function: {
        name: ASK_USER_QUESTIONS_TOOL_NAME,
        description:
            'Show the user one or more multiple-choice questions in an interactive card and wait for their answers. ' +
            'Use it whenever choosing from options is easier for the user than typing a reply: ' +
            'to clarify missing details or preferences, to let them pick between alternatives, ' +
            'or when they ask to be asked questions (quizzes, games, polls, interviews, checklists). ' +
            'Do not use it for questions you can answer from the conversation or other tools. ' +
            "Group concise choice questions together in the user's language. " +
            'Prefer at most 5 options per question, including the custom-answer input when allowCustomAnswer is true (at most 4 listed options plus the custom input). ' +
            "Set allowMultiple to true when several options can apply, or false for a single selection; respect the user's requested selection mode. " +
            'Prefer allowCustomAnswer true when useful answers are likely to fall outside the listed options. ' +
            'This supplies a custom input, so do not add an "Other" option. ' +
            'The UI renders questions directly from the tool call. ' +
            "Never print the arguments, JSON, or Markdown questions, or mention the tool's name to the user. " +
            "After success, end the turn without additional text or tool calls and wait for the user's answers in a new message. " +
            'If validation fails, correct the reported fields and retry the tool. ' +
            'Skipped or dismissed questions provide no answer or approval.',
        parameters: askUserQuestionsSchema,
    },
} satisfies ChatCompletionsFunctionTool;

/**
 * Arguments that fail validation carry `code: invalid_arguments` in the result content, which is what the model and
 * the persisted block both see. The UI reads it to expect a corrected retry and keep the question skeleton up.
 */
const invalidCall = (error: string, code?: typeof ASK_USER_QUESTIONS_INVALID_ARGUMENTS_CODE): ClientToolResult => ({
    is_error: true,
    content: JSON.stringify({
        ok: false,
        ...(code ? { code } : {}),
        error,
        message: 'Correct the reported fields and call ask_user_questions again.',
    }),
});

/**
 * Advertise ask_user_questions and validate its calls on the client.
 * Return validation errors for the model to correct, or acknowledge success so the UI can render
 * the questions from the call arguments. Successful results end the client tool loop without another completion;
 * submitted answers are sent separately as a new user message.
 */
export const askUserQuestionsToolExecutor: ClientToolExecutor = {
    getClientTools: async () => [askUserQuestionsTool],
    canExecute: (name) => name === ASK_USER_QUESTIONS_TOOL_NAME,
    execute: async (calls) =>
        calls.map((call) => {
            if (call.name !== ASK_USER_QUESTIONS_TOOL_NAME) return invalidCall(`Unsupported tool: ${call.name}`);

            let args: unknown;
            try {
                args = JSON.parse(call.arguments);
            } catch {
                return invalidCall('arguments: must be valid JSON', ASK_USER_QUESTIONS_INVALID_ARGUMENTS_CODE);
            }

            const validation = validateAskUserQuestionsToolArguments(args);
            if (!validation.ok) return invalidCall(validation.error, ASK_USER_QUESTIONS_INVALID_ARGUMENTS_CODE);

            return {
                endTurn: true,
                content: JSON.stringify({
                    ok: true,
                    message:
                        'The question UI will render the validated questions directly from this tool call. ' +
                        `Answers submitted through the UI will arrive in the next user message, prefixed with ${ASK_USER_QUESTIONS_TOOL_RESPONSE_IDENTIFIER}. ` +
                        'A message typed directly by the user without using the question UI will not have this prefix.',
                } satisfies ClientToolSuccessResult),
            };
        }),
};

/**
 * Compose the user message submitted to backend from a question card, pairing each question title with the user's
 * selected answers or custom text and explicitly identifying skipped questions.
 */
export function formatAskUserQuestionsToolResponseForModel(askUserQuestionsToolResponse: QuestionAnswer[]): string {
    const askUserQuestionsToolResponseText = askUserQuestionsToolResponse
        .map(({ title, answers, skipped }) => {
            if (skipped || !answers?.length) {
                return `Question: ${title}\nThe user skipped this question.`;
            }

            const answerText = answers.join(', ');
            return `Question: ${title}\nUser answered: ${answerText}`;
        })
        .join('\n\n');
    return `${ASK_USER_QUESTIONS_TOOL_RESPONSE_IDENTIFIER}:\n` + askUserQuestionsToolResponseText;
}

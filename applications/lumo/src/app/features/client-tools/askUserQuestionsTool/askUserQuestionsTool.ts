import type { ClientToolExecutor, ClientToolResult } from '@proton/lumo-api-client/core/client-tools';
import type { ChatCompletionsFunctionTool } from '@proton/lumo-api-client/types-api';

import type { QuestionCardQuestionData } from '../../../components/QuestionCard/types';
import type { QuestionAnswer } from '../../../types';
import type { ClientToolSuccessResult } from '../validationUtils';
import { askUserQuestionsSchema } from './schema';
import { validateAskUserQuestionsToolArguments } from './validation';

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
            'Ask for missing information or preferences that materially affect the response or next action and cannot be resolved from the conversation or available tools. ' +
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

const invalidCall = (error: string): ClientToolResult => ({
    is_error: true,
    content: JSON.stringify({
        ok: false,
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
                return invalidCall('arguments: must be valid JSON');
            }

            const validation = validateAskUserQuestionsToolArguments(args);
            if (!validation.ok) return invalidCall(validation.error);

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

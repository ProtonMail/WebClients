import type { ClientToolExecutor, ClientToolResult } from '@proton/lumo-api-client/core/client-tools';
import type { ChatCompletionsFunctionTool } from '@proton/lumo-api-client/types-api';

import type { QuestionCardQuestionData } from '../../../components/QuestionCard/types';
import type { QuestionAnswer } from '../../../types';
import { askUserQuestionsSchema } from './schema';
import { validateAskUserQuestionsToolArguments } from './validation';

export const ASK_USER_QUESTIONS_TOOL_NAME = 'ask_user_questions';

/** Fully parsed tool arguments, ready to pass to QuestionCard after validation. */
export interface AskUserQuestionsToolArguments {
    questions: QuestionCardQuestionData[];
}

/** Acknowledges that validated questions can be shown; their content stays in the tool-call arguments. */
export interface AskUserQuestionsToolSuccessResult {
    ok: true;
    message: string;
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
            'Set allowCustomAnswer to true to accept an answer outside the listed options. ' +
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
 * the questions from the call arguments. Ask the model to end its turn and wait for the user;
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

            const result: AskUserQuestionsToolSuccessResult = {
                ok: true,
                message:
                    'The UI has rendered the questions directly from this tool call. Never print the tool arguments, JSON, ' +
                    "or a Markdown version of the questions, and do not answer on the user's behalf. " +
                    'End your turn with no additional text or tool calls. ' +
                    "Wait for the user's answers in a new message before continuing.",
            };
            return { content: JSON.stringify(result) };
        }),
};

/**
 * Compose the user message submitted to backend from a question card, pairing each question title with the user's
 * selected answers or custom text and explicitly identifying skipped questions.
 */
export function formatQuestionAnswersForModel(questionAnswers: QuestionAnswer[]): string {
    return questionAnswers
        .map(({ title, answers, skipped }) => {
            if (skipped || !answers?.length) {
                return `Question: ${title}\nThe user skipped this question.`;
            }

            const answerText = answers.join(', ');
            return `Question: ${title}\nUser answered: ${answerText}`;
        })
        .join('\n\n');
}

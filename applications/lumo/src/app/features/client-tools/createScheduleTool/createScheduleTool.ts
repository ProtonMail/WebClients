import type { ClientToolExecutor, ClientToolResult } from '@proton/lumo-api-client/core/client-tools';
import { getDesktopManifests } from '@proton/lumo-api-client/core/desktop-tools';
import type { ChatCompletionsFunctionTool } from '@proton/lumo-api-client/types-api';

import type { CreateScheduleToolResponse } from '../../../types';
import type { ScheduleDetails } from '../../schedules/types';
import type { ClientToolSuccessResult } from '../validationUtils';
import { createScheduleSchema } from './schema';
import { validateCreateScheduleToolArguments } from './validation';

export const CREATE_SCHEDULE_TOOL_NAME = 'create_schedule';
const CREATE_SCHEDULE_TOOL_RESPONSE_IDENTIFIER = 'create_schedule_response';

/** A schedule draft for review. No schedule is saved or activated by this tool. */
export type CreateScheduleToolArguments = Omit<ScheduleDetails, 'autoApprove' | 'notifyOnComplete' | 'connectors'> & {
    /** Connector identifiers; display metadata and review preferences belong to the frontend. */
    connectors: string[];
};

const createScheduleTool = {
    type: 'function',
    function: {
        name: CREATE_SCHEDULE_TOOL_NAME,
        description:
            'Prepare a scheduled task for the user to review when they ask for something to run later or repeatedly. ' +
            '\n\nGather details with ask_user_questions:\n' +
            'Strongly prefer using the ask_user_questions client tool first, when available, unless the conversation already provides enough detail about the task instructions, recurrence rules, and any desktop tools needed. ' +
            'Clarify whether the task needs desktop tools and, if so, which connectors it should use from the registered catalog. ' +
            'Ask for missing recurrence details, including the run time and relevant days or date, and instruction details such as what to do, which sources to read, and the desired output. ' +
            'When asking scheduling questions, offer only recurrence patterns supported by the schema. ' +
            'Default to always_local_time without asking a timezone question. Ask about a fixed timezone only when the user requests one or the task instructions strongly suggest one. ' +
            'Describe always_local_time to the user as "Always matching desktop timezone", translated into their language. ' +
            'For ask_user_questions questions about exact times, dates, or timezones, always set its allowCustomAnswer parameter to true so the user can enter a value outside the suggested choices. ' +
            'Set the ask_user_questions allowMultiple parameter to false for a single run time, and true when multiple weekdays or monthly dates can apply. ' +
            'If the user skips a run time question, you may choose a reasonable run time; preserve any timing they already supplied and show the chosen timing in the review draft. ' +
            'Dismissing questions supplies no answers; clarify essential missing timing unless the user asks you to choose. ' +
            '\n\nRecurrence and timezone:\n' +
            'Before calling create_schedule, resolve the complete requested recurrence: repetition interval, calendar constraints, run time, and timezone. ' +
            'Call this tool only when recurrenceRule can represent every constraint exactly. Each schedule supports one run time: once on a specific date, daily, every week on selected weekdays, or every month on fixed numbered dates. ' +
            'If the user specifies an unsupported recurrence, do not call create_schedule or prepare a schedule draft. Explain the limitation and use ask_user_questions, when available, to ask the user to choose a supported alternative first. ' +
            'Wait for their answer before calling create_schedule; offering alternatives does not authorize choosing one. ' +
            'Never choose an alternative yourself, drop a constraint, or implement missing recurrence conditions inside the task instructions. ' +
            "Use the user's language for the name and instructions, and preserve their requested recurrence and timezone. " +
            'Use always_local_time by default so the run time always matches the desktop timezone, including after it changes. ' +
            "Use a fixed IANA timezone only when requested or strongly suggested by the task instructions; the current timezone, user's language, and location alone do not establish a fixed-timezone preference. " +
            '\n\nDraft review and turn completion:\n' +
            'The client displays a review card from the arguments; this does not save, activate, or execute a schedule. ' +
            'Call create_schedule at most once per assistant response. If several schedules are requested, prepare one draft at a time and wait for its save confirmation before preparing the next. ' +
            'Never claim the task has been scheduled or that connector access has been granted. ' +
            'Do not print the arguments, JSON, or repeat the card in Markdown. ' +
            'After success, end the turn without additional text or tool calls and wait for the user to review the draft. ' +
            'If validation fails, correct the reported fields and call this tool again.',
        parameters: createScheduleSchema,
    },
} satisfies ChatCompletionsFunctionTool;

const invalidCall = (error: string): ClientToolResult => ({
    is_error: true,
    content: JSON.stringify({
        ok: false,
        error,
        message: 'Correct the reported fields and call create_schedule again.',
    }),
});

/** Validate draft details and acknowledge them for rendering, without creating or saving a schedule. */
export const createScheduleToolExecutor: ClientToolExecutor = {
    getClientTools: async () => {
        const manifests = await getDesktopManifests();
        const currentTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        // Advertise connector capabilities as model context; registered ids are checked during execution.
        const catalog = manifests.map(({ id, display_name, description, tools }) => ({
            id,
            name: display_name,
            description,
            tools: tools?.map(({ name, title, description }) => ({ name, title, description })) ?? [],
        }));
        return [
            {
                ...createScheduleTool,
                function: {
                    ...createScheduleTool.function,
                    description: `${createScheduleTool.function.description}\n\nCurrent user IANA timezone: ${currentTimezone}. This is context for interpreting times; keep always_local_time unless a fixed timezone is needed.\n\nRegistered connector catalog: ${JSON.stringify(catalog)}`,
                },
            },
        ];
    },
    canExecute: (name) => name === CREATE_SCHEDULE_TOOL_NAME,
    execute: async (calls) => {
        const connectorIds = new Set((await getDesktopManifests()).map(({ id }) => id));
        return calls.map((call) => {
            if (call.name !== CREATE_SCHEDULE_TOOL_NAME) return invalidCall(`Unsupported tool: ${call.name}`);

            let args: unknown;
            try {
                args = JSON.parse(call.arguments);
            } catch {
                return invalidCall('arguments: must be valid JSON');
            }

            const validation = validateCreateScheduleToolArguments(args, connectorIds);
            if (!validation.ok) return invalidCall(validation.error);

            return {
                endTurn: true,
                content: JSON.stringify({
                    ok: true,
                    message:
                        'The schedule UI will render the validated draft directly from this tool call; this does not save the schedule. ' +
                        `If the user saves or cancels the draft through the UI, their response will arrive in the next user message, prefixed with ${CREATE_SCHEDULE_TOOL_RESPONSE_IDENTIFIER}. ` +
                        'A message typed directly by the user without using the schedule UI will not have this prefix.',
                } satisfies ClientToolSuccessResult),
            };
        });
    },
};

/** Describe the user's draft response to the model without translating the protocol text. */
export function formatCreateScheduleToolResponseForModel({
    name,
    metadataLabel,
    cancelled,
}: Pick<CreateScheduleToolResponse, 'name' | 'metadataLabel' | 'cancelled'>): string {
    return [
        `${CREATE_SCHEDULE_TOOL_RESPONSE_IDENTIFIER}:\n`,
        cancelled
            ? 'The user cancelled this schedule draft. No schedule was saved. Do not recreate it unless the user asks.'
            : 'The user confirmed and saved this scheduled task. Do not create it again.',
        'This response applies only to the schedule described below; it does not confirm any other draft or requested schedule.',
        `Task: ${name}`,
        ...(metadataLabel === undefined ? [] : [`Metadata: ${metadataLabel}`]),
    ].join('\n');
}

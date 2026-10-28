const timeProperties = {
    hour: { type: 'integer', minimum: 0, maximum: 23 },
    minute: { type: 'integer', minimum: 0, maximum: 59 },
    timezone: {
        type: 'string',
        pattern: '\\S',
        description:
            'Default to always_local_time: always matching desktop timezone, including after it changes. ' +
            'Use a fixed IANA timezone only when the user requests it or the task instructions strongly suggest one.',
    },
};

/** JSON Schema for the create_schedule tool. Connector capabilities are supplied in the tool description. */
export const createScheduleSchema = {
    type: 'object',
    properties: {
        name: { type: 'string', pattern: '\\S', maxLength: 64, description: 'A short, descriptive task name.' },
        instructions: {
            type: 'string',
            pattern: '\\S',
            maxLength: 1024,
            description:
                "The prompt sent to the LLM to perform the task on each scheduled run. Make it self-contained, including the user's requirements and desired output.",
        },
        recurrenceRule: {
            description:
                "Wall-clock run time and recurrence. The frequency must preserve the user's requested repetition period, and every requested calendar constraint must fit its fields. If any constraint cannot be represented, ask for agreement to an alternative instead of calling this tool. Include only the fields belonging to the chosen frequency.",
            oneOf: [
                {
                    type: 'object',
                    properties: { ...timeProperties, frequency: { type: 'string', enum: ['DAILY'] } },
                    required: ['frequency', 'hour', 'minute', 'timezone'],
                    additionalProperties: false,
                },
                {
                    type: 'object',
                    properties: {
                        ...timeProperties,
                        frequency: { type: 'string', enum: ['ONCE'] },
                        date: {
                            type: 'string',
                            pattern: '^\\d{4}-\\d{2}-\\d{2}$',
                            description: 'Calendar date in YYYY-MM-DD format.',
                        },
                    },
                    required: ['frequency', 'hour', 'minute', 'timezone', 'date'],
                    additionalProperties: false,
                },
                {
                    type: 'object',
                    properties: {
                        ...timeProperties,
                        frequency: {
                            type: 'string',
                            enum: ['WEEKLY'],
                            description: 'Repeats every week on every selected weekday, without monthly constraints.',
                        },
                        byWeekDay: {
                            type: 'array',
                            description:
                                'RFC 5545 weekday tokens: MO (Monday), TU (Tuesday), WE (Wednesday), TH (Thursday), FR (Friday), SA (Saturday), SU (Sunday).',
                            minItems: 1,
                            uniqueItems: true,
                            items: { type: 'string', enum: ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'] },
                        },
                    },
                    required: ['frequency', 'hour', 'minute', 'timezone', 'byWeekDay'],
                    additionalProperties: false,
                },
                {
                    type: 'object',
                    properties: {
                        ...timeProperties,
                        frequency: {
                            type: 'string',
                            enum: ['MONTHLY'],
                            description: 'Repeats every month on fixed numbered calendar dates.',
                        },
                        byMonthDay: {
                            type: 'array',
                            description: 'Fixed day numbers within each month, independent of the weekday.',
                            minItems: 1,
                            uniqueItems: true,
                            items: { type: 'integer', minimum: 1, maximum: 31 },
                        },
                    },
                    required: ['frequency', 'hour', 'minute', 'timezone', 'byMonthDay'],
                    additionalProperties: false,
                },
            ],
        },
        connectors: {
            type: 'array',
            description:
                'Connector IDs needed for the task. Choose only from the registered connector catalog in the tool description, or use an empty array if none are needed. Selecting a connector does not configure, connect, enable, or grant access to it.',
            items: { type: 'string', pattern: '\\S' },
        },
    },
    required: ['name', 'instructions', 'recurrenceRule', 'connectors'],
    additionalProperties: false,
};

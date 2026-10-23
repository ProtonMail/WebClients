/** JSON Schema for the ask_user_questions tool. */
export const askUserQuestionsSchema = {
    type: 'object',
    properties: {
        questions: {
            type: 'array',
            minItems: 1,
            maxItems: 5,
            description: 'Questions in display order. Each question must have a unique id within this request.',
            items: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        minLength: 1,
                        pattern: '\\S',
                        description: 'A stable question identifier, such as "sources" or "level-of-detail".',
                    },
                    type: { type: 'string', enum: ['choice'] },
                    title: {
                        type: 'string',
                        minLength: 1,
                        pattern: '\\S',
                        description: 'A self-contained question to display to the user.',
                    },
                    options: {
                        type: 'array',
                        minItems: 1,
                        description:
                            'Concrete choices with unique ids within this question. Prefer at most 5 options, ' +
                            'or at most 4 when allowCustomAnswer is true so the custom input counts as the fifth.',
                        items: {
                            type: 'object',
                            properties: {
                                id: { type: 'string', minLength: 1, pattern: '\\S' },
                                label: {
                                    type: 'string',
                                    minLength: 1,
                                    pattern: '\\S',
                                    description: 'Short choice label, returned to the model when selected.',
                                },
                                description: {
                                    type: 'string',
                                    description: 'Optional explanation of the choice or its tradeoffs.',
                                },
                            },
                            required: ['id', 'label'],
                            additionalProperties: false,
                        },
                    },
                    allowMultiple: {
                        type: 'boolean',
                        description:
                            'Allow multiple selections for this question. Set true when several options can apply; ' +
                            'false when exactly one option should be selected.',
                    },
                    allowCustomAnswer: {
                        type: 'boolean',
                        default: false,
                        description: 'Show an additional custom-answer input. Omitted means false.',
                    },
                },
                required: ['id', 'type', 'title', 'options', 'allowMultiple'],
                additionalProperties: false,
            },
        },
    },
    required: ['questions'],
    additionalProperties: false,
};

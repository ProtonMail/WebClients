import type { ToolDefinition, ToolName } from '../contracts/types';

export const LOAD_GUIDE_TOOL_NAME = 'load_guide';

/** Reads a definition's {@link ToolDefinition.guide}. A thunk is product code, so a throw degrades to "no body". */
export const resolveGuide = (definition: ToolDefinition): string | undefined => {
    if (typeof definition.guide !== 'function') {
        return definition.guide;
    }
    try {
        return definition.guide();
    } catch {
        return undefined;
    }
};

/**
 * The framework's own tool, derived from whichever registered tools carry a guide. It has no product
 * handler — {@link createClientToolExecutor} intercepts the call. `undefined` when nothing needs a guide.
 */
export const createLoadGuideDefinition = (definitions: ToolDefinition[]): ToolDefinition | undefined => {
    // Presence, not resolution: a thunk's body depends on live state and this catalogue is built once.
    const guidedTools: ToolName[] = definitions
        .filter((definition) => definition.needsGuide && definition.guide)
        .map((definition) => definition.name);

    if (!guidedTools.length) {
        return undefined;
    }

    return {
        name: LOAD_GUIDE_TOOL_NAME,
        kind: 'read',
        toolDescription: `Fetch the argument rules for a tool before you call it — internal wiring, invisible to the user, and not a step of the task. Required before you use: ${guidedTools.join(
            ', '
        )}. This call and the call it unlocks are ONE action: load, then immediately call that tool. The \`guide\` argument must be exactly one of those tool names.`,
        paramsSchema: {
            type: 'object',
            additionalProperties: false,
            required: ['guide'],
            properties: { guide: { type: 'string', enum: guidedTools } },
        },
        examples: [
            {
                context: `You need to use "${guidedTools[0]}" but its guide is not loaded yet — load it first.`,
                call: { guide: guidedTools[0] },
            },
        ],
        // Never called — the executor handles this tool before it reaches a handler.
        serializeForLumo: () => '',
        // Never shown — the panel hides guide loads — so the label stays untranslated.
        summarizeChip: (params: { guide: ToolName }) => ({ label: `Loaded the ${params.guide} guide` }),
    };
};

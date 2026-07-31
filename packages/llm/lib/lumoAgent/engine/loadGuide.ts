import type { ToolDefinition, ToolName } from '../contracts/types';

export const LOAD_GUIDE_TOOL_NAME = 'load_guide';

/**
 * The framework's own tool, derived from whichever registered tools carry a guide. It has no product
 * handler — {@link createClientToolExecutor} intercepts the call. `undefined` when nothing needs a guide.
 */
export const createLoadGuideDefinition = (definitions: ToolDefinition[]): ToolDefinition | undefined => {
    const guidedTools: ToolName[] = definitions
        .filter((definition) => definition.needsGuide && definition.guide)
        .map((definition) => definition.name);

    if (!guidedTools.length) {
        return undefined;
    }

    return {
        name: LOAD_GUIDE_TOOL_NAME,
        kind: 'read',
        toolDescription: `Load the full usage guide for a tool that needs one before you can use it. Required before you use: ${guidedTools.join(
            ', '
        )}. Call this first with the target tool's name in \`guide\`; the guide comes back as the result and that tool then becomes available. The \`guide\` argument must be exactly one of those tool names.`,
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

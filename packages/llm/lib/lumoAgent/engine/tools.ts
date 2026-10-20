import type { ToolDefinition, ToolDescriptor, ToolName } from '../contracts/types';
import { getActiveTools } from './activeSet';

/**
 * Build the OpenAI-shape client tool descriptors advertised on a turn, from the tools ACTIVE this
 * turn — the always-available tools plus any whose guide has been loaded (see {@link getActiveTools}).
 * Each tool contributes one `{ type:"function", function:{ name, description, parameters } }` entry,
 * with `toolDescription` as the model-facing guidance and `paramsSchema` as the argument contract
 * (the same schema the validation middleware checks against — one source of truth). Schemas are
 * `$ref`-free by construction, matching the descriptor inliner's best-effort handling of `$ref`s.
 *
 * `advertiseAll` advertises every tool, for a product whose system prompt describes them all. A tool
 * with no `toolDescription` is sent without a `description`.
 *
 * The returned {@link ToolDescriptor} is structurally the transport's `ChatCompletionsFunctionTool`,
 * so the engine can hand these straight to the transport's `clientTools` without the pure framework
 * importing transport internals.
 */
export const buildToolDescriptors = (
    definitions: ToolDefinition[],
    loadedGuides: Set<ToolName> | ToolName[],
    { advertiseAll = false }: { advertiseAll?: boolean } = {}
): ToolDescriptor[] =>
    (advertiseAll ? definitions : getActiveTools(definitions, loadedGuides)).map((definition) => ({
        type: 'function',
        function: {
            name: definition.name,
            ...(definition.toolDescription && { description: definition.toolDescription }),
            parameters: definition.paramsSchema,
        },
    }));

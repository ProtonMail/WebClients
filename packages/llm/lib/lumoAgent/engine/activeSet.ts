import type { ToolDefinition, ToolName } from '../contracts/types';

/**
 * The tools active for a turn: those needing no guide, plus those whose guide has been loaded this
 * session. This is what narrows the advertised tool set (progressive disclosure of the schema) — a
 * guide-bearing tool's params only enter the active set once the model pulls its guide via
 * `load_guide`.
 */
export const getActiveTools = (
    definitions: ToolDefinition[],
    loadedGuides: Set<ToolName> | ToolName[]
): ToolDefinition[] => {
    const loaded = loadedGuides instanceof Set ? loadedGuides : new Set(loadedGuides);
    return definitions.filter((definition) => !definition.needsGuide || loaded.has(definition.name));
};

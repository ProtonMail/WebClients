import type { LumoAgentConfig } from '@proton/components/components/lumoAgent/types';
import type { ToolHandlers } from '@proton/llm/lib/lumoAgent/contracts/types';

import { DRIVE_RULES } from './rules';
import { getCurrentFolderModule } from './skills/reads/getCurrentFolder';
import type { DriveToolDeps, DriveToolModule } from './toolModule';

/**
 * The Drive tool pack. Each entry is a self-contained module (definition + handler factory — see
 * {@link DriveToolModule}); adding a tool means adding it here and nowhere else.
 */
const MODULES: DriveToolModule[] = [getCurrentFolderModule];

/**
 * Assemble the {@link LumoAgentConfig} handed to `useLumoAgent`, binding every handler to Drive via
 * `deps`. Drive reads what is on screen and nothing else for now; more tools arrive as more modules,
 * which is why this splits them back into the layered inputs the framework expects — definitions for
 * the engine, dependency-bound handlers for dispatch (mutations add card renderers, as Mail's does).
 *
 * Called ONCE from {@link LumoDriveProvider}: the hook rebuilds its executor whenever the config
 * identity changes, so the result must stay referentially stable across renders — hence `deps` reads
 * live values through getters rather than taking them.
 */
export const buildLumoDriveConfig = (deps: DriveToolDeps): LumoAgentConfig => {
    const handlers: ToolHandlers = Object.fromEntries(
        MODULES.map((module) => [module.definition.name, module.createHandler(deps)])
    );

    return {
        definitions: MODULES.map((module) => module.definition),
        handlers,
        productRules: DRIVE_RULES,
    };
};

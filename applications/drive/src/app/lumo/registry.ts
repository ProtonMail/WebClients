import type { LumoAgentConfig } from '@proton/components/components/lumoAgent/types';
import type { ToolHandlers } from '@proton/llm/lib/lumoAgent/contracts/types';

import { buildDriveRules } from './rules';
import { getCurrentFolderModule } from './skills/reads/getCurrentFolder';
import { getOpenFileContentModule } from './skills/reads/getOpenFileContent';
import type { DriveToolDeps, DriveToolModule } from './toolModule';

/**
 * The Drive tool pack. Each entry is a self-contained module (definition + handler factory — see
 * {@link DriveToolModule}); adding a tool means adding it here and nowhere else.
 */
const MODULES: DriveToolModule[] = [getCurrentFolderModule];

/**
 * Assemble the {@link LumoAgentConfig} handed to `useLumoAgent`, binding every handler to Drive via
 * `deps`. Both surfaces use it: the drawer, and the file preview, which passes `getOpenFile` and so gets
 * the open-file tool on top of the shared pack.
 *
 * Called ONCE per surface, since the hook rebuilds its executor when the config identity changes. So
 * `deps` reads live values through getters, and the rules are built per message instead of baked in here.
 */
export const buildLumoDriveConfig = (deps: DriveToolDeps): LumoAgentConfig => {
    const modules = deps.getOpenFile ? [...MODULES, getOpenFileContentModule] : MODULES;
    const handlers: ToolHandlers = Object.fromEntries(
        modules.map((module) => [module.definition.name, module.createHandler(deps)])
    );

    return {
        definitions: modules.map((module) => module.definition),
        handlers,
        productRules: () => buildDriveRules(deps.getOpenFile?.()),
    };
};

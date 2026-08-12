import type { LumoAgentConfig } from '@proton/components/components/lumoAgent/types';

import { DRIVE_RULES } from './rules';

/**
 * Assemble the {@link LumoAgentConfig} handed to `useLumoAgent`. Drive is chat only for now, so the
 * model gets Drive's rules and nothing to call. Tools get registered here when they land — see
 * `proton-mail/lumo/registry.ts` for the module-per-tool pattern (definitions for the engine,
 * dependency-bound handlers, card renderers) — which keeps the provider untouched as the pack grows.
 *
 * Called ONCE from {@link LumoDriveProvider}: the hook rebuilds its executor whenever the config
 * identity changes, so the result must stay referentially stable across renders.
 */
export const buildLumoDriveConfig = (): LumoAgentConfig => ({
    definitions: [],
    handlers: {},
    productRules: DRIVE_RULES,
});

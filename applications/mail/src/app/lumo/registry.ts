import type { LumoAgentConfig } from '@proton/components/components/lumoAgent/types';

import { MAIL_RULES } from './rules';

/**
 * The Mail tool pack handed to {@link useLumoAgent}. It is deliberately empty for now — the assistant is
 * chat-only, proving the framework wires into Mail end to end. Each skill MR (MR7+) registers its
 * modules here: a definition per tool, a matching handler, and (for mutations) a card renderer.
 *
 * A module-level constant so the reference stays stable across renders (the hook rebuilds its executor
 * only when this changes). Once handlers touch the Redux store they will be assembled inside the
 * provider with `useMemo`; until then a constant is correct and simplest.
 */
export const lumoMailConfig: LumoAgentConfig = {
    definitions: [],
    handlers: {},
    cardRenderers: {},
    productRules: MAIL_RULES,
};

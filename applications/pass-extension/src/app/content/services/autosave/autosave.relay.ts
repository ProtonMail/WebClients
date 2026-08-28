import noop from '@proton/utils/noop';

import type { AutosaveService } from './autosave.abstract';
import { createAutosaveService } from './autosave.service';

/** Partial autosave service for sub-frames: only one-off autosave
 * prompts are supported (eg: password autosuggest). Full reconciliation
 * requires cross-frame field clustering (CC) and is not yet implemented.
 * `reconciliate` and `destroy` are therefore noops for now. */
export const createAutosaveRelay = (): AutosaveService => {
    const service = createAutosaveService();

    return {
        prompt: service.prompt,
        destroy: noop,
        reconciliate: noop,
    };
};

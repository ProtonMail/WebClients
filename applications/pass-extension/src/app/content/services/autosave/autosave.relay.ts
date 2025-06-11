import type { AutosaveService } from 'proton-pass-extension/app/content/services/autosave/autosave.abstract';

import noop from '@proton/utils/noop';

export const createAutosaveRelay = (): AutosaveService => {
    return {
        prompt: () => false,
        reconciliate: noop,
    };
};

import type { AutosaveService } from 'proton-pass-extension/app/content/services/autosave/autosave.abstract';

import noop from '@proton/utils/noop';

/** TODO: Sub-frame autosaving is not currently supported.
 * Only credit card autofilling capabilities are supported
 * in sub-frames. Implementing autosave would require cross
 * -frame field value reconciliation */
export const createAutosaveRelay = (): AutosaveService => {
    return {
        prompt: () => false,
        reconciliate: noop,
    };
};

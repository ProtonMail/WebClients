import { ImportType } from '@proton/activation/interface';

import { ImportProvider } from '../../types/shared.types';

export type ImapDraftState = {
    step: 'idle' | 'started';
    provider?: ImportProvider;
    product?: ImportType;
    /** User can be asked to read an instructions modal */
    hasReadInstructions?: boolean;
};

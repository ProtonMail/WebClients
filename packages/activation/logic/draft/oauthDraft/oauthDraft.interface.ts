import { ImportType } from '@proton/activation/interface';

import { ImportProvider } from '../../types/shared.types';

export type OauthDraftState = {
    step: 'idle' | 'started';
    provider?: ImportProvider;
    products?: ImportType[];
};

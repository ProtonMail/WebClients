import { ImportType } from '@proton/shared/lib/interfaces/EasySwitch';

import { ImportProvider } from '../../types/shared.types';

export type OauthDraftState = {
    step: 'idle' | 'started';
    provider?: ImportProvider;
    products?: ImportType[];
};

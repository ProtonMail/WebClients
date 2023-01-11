import { ImportType } from '@proton/activation/interface';
import { ImportProvider } from '@proton/activation/interface';

export type OauthDraftState = {
    step: 'idle' | 'started';
    provider?: ImportProvider;
    products?: ImportType[];
};

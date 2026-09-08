import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import type { ModelTier } from '../providers/modelTierConstants';

export type GetModelDisplayNameOptions = {
    withFlag?: boolean;
    liteLabel?: 'full' | 'short';
};

export function getModelDisplayName(modelTier: ModelTier, options?: GetModelDisplayNameOptions): string {
    if (modelTier === 'lumo-max') {
        return `${LUMO_SHORT_APP_NAME} 2.0 Max`;
    }

    if (modelTier === 'apertus-15') {
        const name = 'Apertus 1.5';
        return options?.withFlag ? `${name} 🇨🇭` : name;
    }

    return options?.liteLabel === 'short'
        ? `${LUMO_SHORT_APP_NAME} Lite`
        : `${LUMO_SHORT_APP_NAME} 2.0 Lite`;
}

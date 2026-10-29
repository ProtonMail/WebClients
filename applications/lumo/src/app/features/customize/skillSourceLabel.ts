import { c } from 'ttag';

import { BRAND_NAME, LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import type { SkillSource } from '../skills/types';

export const getSkillSourceLabel = (source: SkillSource): string => {
    switch (source) {
        case 'custom-lumo':
            return c('collider_2025:Label').t`From Custom ${LUMO_SHORT_APP_NAME}s`;
        case 'proton':
            return c('collider_2025:Label').t`From ${BRAND_NAME}`;
        case 'uploaded':
            return c('collider_2025:Label').t`Uploaded`;
        case 'created':
            return c('collider_2025:Label').t`Created by you`;
    }
};

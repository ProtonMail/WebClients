import { c } from 'ttag';

import type { ArtifactType } from './parseArtifacts';

const capitalize = (value: string) => {
    if (!value) {
        return value;
    }
    return value.charAt(0).toUpperCase() + value.slice(1);
};

/** Figma-style subtitle for drawer artifact rows (e.g. Document · MD, Code · TypeScript). */
export const getArtifactDrawerTypeLabel = (type: ArtifactType, language?: string): string => {
    switch (type) {
        case 'document':
            return c('collider_2025:Info').t`Document · MD`;
        case 'code': {
            const lang = language?.trim();
            if (lang) {
                const langLabel = capitalize(lang);
                return c('collider_2025:Info').t`Code · ${langLabel}`;
            }
            return c('collider_2025:Info').t`Code`;
        }
        case 'webpage':
            return c('collider_2025:Info').t`Webpage · HTML`;
        case 'presentation':
            return c('collider_2025:Info').t`Presentation · HTML`;
        default:
            return c('collider_2025:Info').t`Creation`;
    }
};

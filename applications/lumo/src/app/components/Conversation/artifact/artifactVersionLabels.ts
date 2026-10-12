import { format, isToday, isYesterday } from 'date-fns';
import { c } from 'ttag';

import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { dateLocale } from '@proton/shared/lib/i18n';

import type { ArtifactVersion } from './artifactRegistry';

/**
 * Absolute times rather than "5m ago": versions are often minutes apart, and relative labels would
 * blur them together (and go stale while the list is open).
 */
export const formatArtifactVersionTime = (createdAt: string): string => {
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) {
        return '';
    }
    const time = format(date, 'p', { locale: dateLocale });
    if (isToday(date)) {
        return c('collider_2025:Time').t`Today at ${time}`;
    }
    if (isYesterday(date)) {
        return c('collider_2025:Time').t`Yesterday at ${time}`;
    }
    const day = format(date, 'PP', { locale: dateLocale });
    return c('collider_2025:Time').t`${day} at ${time}`;
};

export const getArtifactVersionAuthor = (version: ArtifactVersion): string => {
    if (version.source === 'manual-edit') {
        return c('collider_2025:Info').t`You`;
    }
    return LUMO_SHORT_APP_NAME;
};

/** One line on what produced the version: the user's request when we have it. */
export const getArtifactVersionDescription = (version: ArtifactVersion, versionIndex: number): string => {
    if (version.source === 'manual-edit') {
        return c('collider_2025:Info').t`Edited by hand`;
    }
    if (version.promptExcerpt) {
        return version.promptExcerpt;
    }
    if (version.source === 'inline-edit') {
        return c('collider_2025:Info').t`Changed a selection`;
    }
    if (versionIndex === 0) {
        return c('collider_2025:Info').t`Created`;
    }
    return c('collider_2025:Info').t`Revised`;
};

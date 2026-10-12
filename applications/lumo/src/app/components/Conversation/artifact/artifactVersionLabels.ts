import { differenceInMinutes, format, isToday, isYesterday } from 'date-fns';
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

/**
 * Compact age for the title menu's version rows ("Now", "12 min", then a clock time or date).
 * Computed when the menu renders; the full time stays available via `formatArtifactVersionTime`.
 */
export const formatArtifactVersionAge = (createdAt: string, now: Date = new Date()): string => {
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) {
        return '';
    }
    const minutes = differenceInMinutes(now, date);
    if (minutes < 1) {
        return c('collider_2025:Time').t`Now`;
    }
    if (minutes < 60) {
        return c('collider_2025:Time').t`${minutes} min`;
    }
    if (isToday(date)) {
        return format(date, 'p', { locale: dateLocale });
    }
    if (isYesterday(date)) {
        return c('collider_2025:Time').t`Yesterday`;
    }
    return format(date, 'PP', { locale: dateLocale });
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

/** Right-hand meta of a version row: who made it and how long ago, e.g. "You · Now". */
export const getArtifactVersionMeta = (version: ArtifactVersion, now?: Date): string => {
    const author = getArtifactVersionAuthor(version);
    const age = formatArtifactVersionAge(version.createdAt, now);
    if (!age) {
        return author;
    }
    return `${author} · ${age}`;
};

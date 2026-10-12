import { differenceInCalendarDays, format, isSameYear } from 'date-fns';

import { dateLocale } from '@proton/shared/lib/i18n';

export type CreationsListItem = {
    localId: string;
    localSpaceId: string;
    remoteId: string;
    createdAt: Date;
};

export type CreationsListSection = {
    label: string;
    items: CreationsListItem[];
};

const RECENT_DAY_SECTION_THRESHOLD = 7;

export function getCreationSectionLabel(date: Date, now: Date = new Date()): string {
    const ageDays = differenceInCalendarDays(now, date);

    if (ageDays >= 0 && ageDays < RECENT_DAY_SECTION_THRESHOLD) {
        return format(date, 'MMM d', { locale: dateLocale });
    }

    if (isSameYear(date, now)) {
        return format(date, 'MMMM', { locale: dateLocale });
    }

    return format(date, 'MMMM yyyy', { locale: dateLocale });
}

export function groupCreationsIntoSections(items: CreationsListItem[], now: Date = new Date()): CreationsListSection[] {
    const sorted = [...items].sort((a, b) => {
        return b.createdAt.getTime() - a.createdAt.getTime();
    });

    const sections: CreationsListSection[] = [];
    const sectionIndexByLabel = new Map<string, number>();

    for (const item of sorted) {
        const label = getCreationSectionLabel(item.createdAt, now);
        const existingIndex = sectionIndexByLabel.get(label);

        if (existingIndex === undefined) {
            sectionIndexByLabel.set(label, sections.length);
            sections.push({ label, items: [item] });
        } else {
            sections[existingIndex].items.push(item);
        }
    }

    return sections;
}

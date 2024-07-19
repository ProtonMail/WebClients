import { fromUnixTime, isThisWeek, isThisYear, isToday, isYesterday } from 'date-fns';
import { c } from 'ttag';

import { dateLocale } from '@proton/shared/lib/i18n';
import isLastWeek from '@proton/utils/isLastWeek';

import type { DriveFileRevision } from '../../store';

export type RevisionCategory = { title: string; list: DriveFileRevision[] };
export type CategorizedRevisions = Map<string, RevisionCategory>;
export function getCategorizedRevisions(
    revisions: DriveFileRevision[],
    localeCode = dateLocale.code
): CategorizedRevisions {
    return revisions.reduce<CategorizedRevisions>((result, revision) => {
        const dateStart = fromUnixTime(revision.createTime);

        switch (true) {
            case isToday(dateStart):
                const todayRevisions = result.get('today');
                result.set(
                    'today',
                    todayRevisions
                        ? { title: todayRevisions.title, list: [...todayRevisions.list, revision] }
                        : { title: c('Info').t`Today`, list: [revision] }
                );
                break;
            case isYesterday(dateStart):
                const yesterdayRevisions = result.get('yesterday');
                result.set(
                    'yesterday',
                    yesterdayRevisions
                        ? { title: yesterdayRevisions.title, list: [...yesterdayRevisions.list, revision] }
                        : { title: c('Info').t`Yesterday`, list: [revision] }
                );
                break;
            case isThisWeek(dateStart):
                const dayOfWeek = dateStart.getDay();
                const dayOfWeekRevisions = result.get(`d${dayOfWeek}`);
                result.set(
                    `d${dayOfWeek}`,
                    dayOfWeekRevisions
                        ? { title: dayOfWeekRevisions.title, list: [...dayOfWeekRevisions.list, revision] }
                        : {
                              title: new Intl.DateTimeFormat(localeCode, { weekday: 'long' }).format(dateStart),
                              list: [revision],
                          }
                );
                break;
            case isLastWeek(dateStart):
                const lastWeekRevisions = result.get('last-week');
                result.set(
                    'last-week',
                    lastWeekRevisions
                        ? { title: lastWeekRevisions.title, list: [...lastWeekRevisions.list, revision] }
                        : { title: c('Info').t`Last week`, list: [revision] }
                );
                break;
            case isThisYear(dateStart):
                const monthOfYear = dateStart.getMonth();
                const monthOfYearRevisions = result.get(`m${monthOfYear}`);
                result.set(
                    `m${monthOfYear}`,
                    monthOfYearRevisions
                        ? {
                              title: monthOfYearRevisions.title,
                              list: [...monthOfYearRevisions.list, revision],
                          }
                        : {
                              title: new Intl.DateTimeFormat(localeCode, { month: 'long' }).format(dateStart),
                              list: [revision],
                          }
                );
                break;
            default:
                const year = dateStart.getFullYear().toString();
                const yearRevisions = result.get(year);
                result.set(
                    year,
                    yearRevisions
                        ? { title: yearRevisions.title, list: [...yearRevisions.list, revision] }
                        : {
                              title: new Intl.DateTimeFormat(localeCode, { year: 'numeric' }).format(dateStart),
                              list: [revision],
                          }
                );
                break;
        }

        return result;
    }, new Map());
}

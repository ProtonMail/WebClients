import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';

import type { Revision } from '@proton/drive/sdk';

import { getCategorizedRevisions } from './getCategorizedRevisions';

describe('getCategorizedRevisions', () => {
    beforeEach(() => {
        jest.useFakeTimers().setSystemTime(new Date('2023-03-17T12:00:00'));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('categorizes revisions correctly', () => {
        const now = new Date('2023-03-17T12:00:00');
        const revisions = [
            { creationTime: new Date(now.getTime() - 2 * 60 * 60 * 1000) }, // 2 hours ago (today)
            { creationTime: new Date(now.getTime() - 5 * 60 * 60 * 1000) }, // 5 hours ago (today)
            { creationTime: new Date(now.getTime() - 24 * 60 * 60 * 1000) }, // 24 hours ago (yesterday)
            { creationTime: new Date(now.getTime() - 29 * 60 * 60 * 1000) }, // 29 hours ago (yesterday)
            { creationTime: new Date(now.getTime() - 31 * 60 * 60 * 1000) }, // 31 hours ago (yesterday)
            { creationTime: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) }, // 3 days ago (this week - Tuesday)
            { creationTime: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }, // 7 days ago (last week)
            { creationTime: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000) }, // 10 days ago (last week)
            { creationTime: new Date(now.getTime() - 38 * 24 * 60 * 60 * 1000) }, // 38 days ago (February)
            { creationTime: new Date(now.getTime() - 44 * 24 * 60 * 60 * 1000) }, // 44 days ago (February)
            { creationTime: new Date('2021-12-25T12:00:00') }, // December 25, 2021
            { creationTime: new Date('2021-05-25T12:00:00') }, // May 25, 2021
            { creationTime: new Date('2020-06-30T12:00:00') }, // June 30, 2020
            { creationTime: new Date('2019-06-01T12:00:00') }, // June 1, 2019
        ] as Revision[];

        const result = getCategorizedRevisions(revisions, 'en-US');

        expect([...result.entries()]).toStrictEqual([
            ['today', { title: 'Today', list: [revisions[0], revisions[1]] }],
            ['yesterday', { title: 'Yesterday', list: [revisions[2], revisions[3], revisions[4]] }],
            ['d2', { title: 'Tuesday', list: [revisions[5]] }],
            ['last-week', { title: 'Last week', list: [revisions[6], revisions[7]] }],
            ['m1', { title: 'February', list: [revisions[8], revisions[9]] }],
            ['2021', { title: '2021', list: [revisions[10], revisions[11]] }],
            ['2020', { title: '2020', list: [revisions[12]] }],
            ['2019', { title: '2019', list: [revisions[13]] }],
        ]);
    });

    it('puts a revision from late on last Saturday in last week', () => {
        jest.setSystemTime(new Date('2023-03-20T12:00:00')); // Monday
        const revisions = [
            { creationTime: new Date('2023-03-18T02:00:00') }, // Saturday, last week
            { creationTime: new Date('2023-03-13T02:00:00') }, // Monday, last week
            { creationTime: new Date('2023-03-11T02:00:00') }, // Saturday, two weeks ago
        ] as Revision[];

        const result = getCategorizedRevisions(revisions, 'en-US');

        expect([...result.entries()]).toStrictEqual([
            ['last-week', { title: 'Last week', list: [revisions[0], revisions[1]] }],
            ['m2', { title: 'March', list: [revisions[2]] }],
        ]);
    });

    it('splits groups exactly at day and week boundaries', () => {
        jest.setSystemTime(new Date('2023-03-22T12:00:00')); // Wednesday
        const revisions = [
            { creationTime: new Date('2023-03-22T00:00:00') }, // today, first minute
            { creationTime: new Date('2023-03-21T23:59:59') }, // yesterday, last second
            { creationTime: new Date('2023-03-20T00:00:00') }, // Monday, this week
            { creationTime: new Date('2023-03-19T00:00:00') }, // Sunday, start of this week
            { creationTime: new Date('2023-03-18T23:59:59') }, // Saturday, end of last week
            { creationTime: new Date('2023-03-12T00:00:00') }, // Sunday, start of last week
            { creationTime: new Date('2023-03-11T23:59:59') }, // Saturday, two weeks ago
        ] as Revision[];

        const result = getCategorizedRevisions(revisions, 'en-US');

        expect([...result.entries()]).toStrictEqual([
            ['today', { title: 'Today', list: [revisions[0]] }],
            ['yesterday', { title: 'Yesterday', list: [revisions[1]] }],
            ['d1', { title: 'Monday', list: [revisions[2]] }],
            ['d0', { title: 'Sunday', list: [revisions[3]] }],
            ['last-week', { title: 'Last week', list: [revisions[4], revisions[5]] }],
            ['m2', { title: 'March', list: [revisions[6]] }],
        ]);
    });

    it('shows Saturday as yesterday on a Sunday', () => {
        jest.setSystemTime(new Date('2023-03-19T12:00:00')); // Sunday
        const revisions = [
            { creationTime: new Date('2023-03-18T23:00:00') }, // Saturday, yesterday
            { creationTime: new Date('2023-03-17T23:00:00') }, // Friday, last week
            { creationTime: new Date('2023-03-12T00:00:00') }, // Sunday, start of last week
            { creationTime: new Date('2023-03-11T23:00:00') }, // Saturday, two weeks ago
        ] as Revision[];

        const result = getCategorizedRevisions(revisions, 'en-US');

        expect([...result.entries()]).toStrictEqual([
            ['yesterday', { title: 'Yesterday', list: [revisions[0]] }],
            ['last-week', { title: 'Last week', list: [revisions[1], revisions[2]] }],
            ['m2', { title: 'March', list: [revisions[3]] }],
        ]);
    });

    it('keeps last week together when it spans two months', () => {
        jest.setSystemTime(new Date('2023-03-08T12:00:00')); // Wednesday, last week is Feb 26 - Mar 4
        const revisions = [
            { creationTime: new Date('2023-03-04T23:00:00') }, // Saturday, March
            { creationTime: new Date('2023-02-28T23:00:00') }, // Tuesday, February
            { creationTime: new Date('2023-02-25T23:00:00') }, // Saturday, two weeks ago
        ] as Revision[];

        const result = getCategorizedRevisions(revisions, 'en-US');

        expect([...result.entries()]).toStrictEqual([
            ['last-week', { title: 'Last week', list: [revisions[0], revisions[1]] }],
            ['m1', { title: 'February', list: [revisions[2]] }],
        ]);
    });

    it('keeps last week together when it spans two years', () => {
        jest.setSystemTime(new Date('2023-01-04T12:00:00')); // Wednesday, last week is Dec 25 - Dec 31
        const revisions = [
            { creationTime: new Date('2023-01-01T10:00:00') }, // Sunday, this week
            { creationTime: new Date('2022-12-31T23:00:00') }, // Saturday, last week
            { creationTime: new Date('2022-12-25T00:00:00') }, // Sunday, start of last week
            { creationTime: new Date('2022-12-24T23:00:00') }, // Saturday, last year
        ] as Revision[];

        const result = getCategorizedRevisions(revisions, 'en-US');

        expect([...result.entries()]).toStrictEqual([
            ['d0', { title: 'Sunday', list: [revisions[0]] }],
            ['last-week', { title: 'Last week', list: [revisions[1], revisions[2]] }],
            ['2022', { title: '2022', list: [revisions[3]] }],
        ]);
    });

    it('keeps nightly revisions in chronological order across last week and months', () => {
        jest.setSystemTime(new Date('2026-10-19T12:00:00')); // Monday
        // Nightly uploads from Oct 17 back to Sep 18, newest first (Oct 18 is the current version)
        const revisions = Array.from({ length: 30 }, (_, i) => {
            const creationTime = new Date('2026-10-17T23:00:00');
            creationTime.setDate(creationTime.getDate() - i);
            return { creationTime };
        }) as Revision[];

        const result = getCategorizedRevisions(revisions, 'en-US');

        const days = [...result.values()].map(({ title, list }) => [
            title,
            list.map((revision) => format(revision.creationTime, 'MMM d', { locale: enUS })),
        ]);
        expect(days).toStrictEqual([
            ['Last week', ['Oct 17', 'Oct 16', 'Oct 15', 'Oct 14', 'Oct 13', 'Oct 12', 'Oct 11']],
            ['October', ['Oct 10', 'Oct 9', 'Oct 8', 'Oct 7', 'Oct 6', 'Oct 5', 'Oct 4', 'Oct 3', 'Oct 2', 'Oct 1']],
            [
                'September',
                [
                    'Sep 30',
                    'Sep 29',
                    'Sep 28',
                    'Sep 27',
                    'Sep 26',
                    'Sep 25',
                    'Sep 24',
                    'Sep 23',
                    'Sep 22',
                    'Sep 21',
                    'Sep 20',
                    'Sep 19',
                    'Sep 18',
                ],
            ],
        ]);
    });
});

import type { Revision } from '@proton/drive';

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
});

import { DriveFileRevision } from '../../store';
import { getCategorizedRevisions } from './getCategorizedRevisions';

describe('getCategorizedRevisions', () => {
    beforeEach(() => {
        jest.useFakeTimers().setSystemTime(new Date('2023-03-17T20:00:00'));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('categorizes revisions correctly', () => {
        const revisions = [
            { createTime: 1679058000 }, // March 17, 2023 at 2:00 PM
            { createTime: 1679036400 }, // March 17, 2023 at 7:00 AM
            { createTime: 1678968000 }, // March 16, 2023 at 12:00 PM
            { createTime: 1678986000 }, // March 16, 2023 at 5:00 PM
            { createTime: 1678950000 }, // March 16, 2023 at 7:00 AM
            { createTime: 1678777200 }, // March 14, 2023 at 7:00 AM
            { createTime: 1678431600 }, // March 10, 2023 at 7:00 AM
            { createTime: 1678172400 }, // March 7, 2023 at 7:00 AM
            { createTime: 1675753200 }, // February 7, 2023 at 7:00 AM
            { createTime: 1675234800 }, // February 1, 2023 at 7:00 AM
            { createTime: 1640415600 }, // December 25, 2021 at 7:00 AM
            { createTime: 1621926000 }, // May 25, 2021 at 7:00 AM
            { createTime: 1593500400 }, // June 30, 2020 at 7:00 AM
            { createTime: 1559372400 }, // June 1, 2019 at 7:00 AM
        ] as DriveFileRevision[];

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

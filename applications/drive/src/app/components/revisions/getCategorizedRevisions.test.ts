import type { Revision } from '@proton/drive';

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
            { creationTime: new Date(1679058000 * 1000) }, // March 17, 2023 at 2:00 PM
            { creationTime: new Date(1679036400 * 1000) }, // March 17, 2023 at 7:00 AM
            { creationTime: new Date(1678968000 * 1000) }, // March 16, 2023 at 12:00 PM
            { creationTime: new Date(1678986000 * 1000) }, // March 16, 2023 at 5:00 PM
            { creationTime: new Date(1678950000 * 1000) }, // March 16, 2023 at 7:00 AM
            { creationTime: new Date(1678777200 * 1000) }, // March 14, 2023 at 7:00 AM
            { creationTime: new Date(1678431600 * 1000) }, // March 10, 2023 at 7:00 AM
            { creationTime: new Date(1678172400 * 1000) }, // March 7, 2023 at 7:00 AM
            { creationTime: new Date(1675753200 * 1000) }, // February 7, 2023 at 7:00 AM
            { creationTime: new Date(1675234800 * 1000) }, // February 1, 2023 at 7:00 AM
            { creationTime: new Date(1640415600 * 1000) }, // December 25, 2021 at 7:00 AM
            { creationTime: new Date(1621926000 * 1000) }, // May 25, 2021 at 7:00 AM
            { creationTime: new Date(1593500400 * 1000) }, // June 30, 2020 at 7:00 AM
            { creationTime: new Date(1559372400 * 1000) }, // June 1, 2019 at 7:00 AM
        ] as Revision[];

        const result = getCategorizedRevisions(revisions, 'en-US');

        expect([...result.entries()]).toStrictEqual([
            ['today', { title: 'Today', list: [revisions[0], revisions[1]] }],
            ['yesterday', { title: 'Yesterday', list: [revisions[2], revisions[3], revisions[4]] }],
            ['d2', { title: 'Tuesday', list: [revisions[5]] }],
            ['last-week', { title: 'Last week', list: [revisions[6], revisions[7]] }],
            // eslint-disable-next-line custom-rules/deprecate-spacing-utility-classes
            ['m1', { title: 'February', list: [revisions[8], revisions[9]] }],
            ['2021', { title: '2021', list: [revisions[10], revisions[11]] }],
            ['2020', { title: '2020', list: [revisions[12]] }],
            ['2019', { title: '2019', list: [revisions[13]] }],
        ]);
    });
});

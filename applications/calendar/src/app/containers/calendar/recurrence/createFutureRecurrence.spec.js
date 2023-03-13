import { MAX_CHARS_API } from '@proton/shared/lib/calendar/constants';

import { getFutureRecurrenceUID } from './createFutureRecurrence';

describe('create future recurrence', () => {
    it('should append a recurrence offset for short uids without previous offset', () => {
        expect(
            getFutureRecurrenceUID(
                '6pG/5UGJGWB9O88ykIOCYx75cjUb@proton.me',
                new Date(Date.UTC(2000, 1, 1, 1, 1, 1)),
                false
            )
        ).toBe('6pG/5UGJGWB9O88ykIOCYx75cjUb_R20000101T010101@proton.me');

        expect(getFutureRecurrenceUID('9O88ykIOCYx75cjUb', new Date(Date.UTC(1990, 8, 13, 13, 0, 15)), false)).toBe(
            '9O88ykIOCYx75cjUb_R19900813T130015'
        );

        expect(getFutureRecurrenceUID('9O@8@8yk@google.com', new Date(Date.UTC(2000, 1, 1, 0, 0, 0)), true)).toBe(
            '9O@8@8yk_R20000101@google.com'
        );
    });

    it('should append a recurrence offset for long uids without previous offset', () => {
        const chars180 =
            'tenchars01tenchars02tenchars03tenchars04tenchars05tenchars06tenchars07tenchars08tenchars09tenchars10tenchars11tenchars12tenchars13tenchars14tenchars15tenchars16tenchars17tenchars18';
        const domain = '@proton.me';
        const expectedOffsetPartday = '_R20000101T010101';
        const expectedOffsetAllday = '_R20000101';

        expect(getFutureRecurrenceUID(`${chars180}${domain}`, new Date(Date.UTC(2000, 1, 1, 1, 1, 1)), false)).toBe(
            `${chars180.slice(
                chars180.length + expectedOffsetPartday.length + domain.length - MAX_CHARS_API.UID
            )}${expectedOffsetPartday}${domain}`
        );
        expect(getFutureRecurrenceUID(`${chars180}${domain}`, new Date(Date.UTC(2000, 1, 1, 1, 1, 1)), true)).toBe(
            `${chars180.slice(
                chars180.length + expectedOffsetAllday.length + domain.length - MAX_CHARS_API.UID
            )}${expectedOffsetAllday}${domain}`
        );
    });

    it('should replace recurrence offset(s) for short uids with previous offsets', () => {
        // part-day -> part-day; single offset
        expect(
            getFutureRecurrenceUID(
                '6pG/5UGJGWB9O88ykIOCYx75cjUb_R22220202T020202@proton.me',
                new Date(Date.UTC(2000, 1, 1, 1, 1, 1)),
                false
            )
        ).toBe('6pG/5UGJGWB9O88ykIOCYx75cjUb_R20000101T010101@proton.me');

        // part-day -> all-day; single offset
        expect(
            getFutureRecurrenceUID(
                '6pG/5UGJGWB9O88ykIOCYx75cjUb_R22220202T020202@proton.me',
                new Date(Date.UTC(2000, 1, 1, 1, 1, 1)),
                true
            )
        ).toBe('6pG/5UGJGWB9O88ykIOCYx75cjUb_R20000101@proton.me');

        // all-day -> all-day; single offset
        expect(
            getFutureRecurrenceUID(
                '6pG/5UGJGWB9O88ykIOCYx75cjUb_R22220202@proton.me',
                new Date(Date.UTC(2000, 1, 1, 1, 1, 1)),
                true
            )
        ).toBe('6pG/5UGJGWB9O88ykIOCYx75cjUb_R20000101@proton.me');

        // all-day -> part-day; single offset
        expect(
            getFutureRecurrenceUID(
                '6pG/5UGJGWB9O88ykIOCYx75cjUb_R22220202@proton.me',
                new Date(Date.UTC(2000, 1, 1, 1, 1, 1)),
                false
            )
        ).toBe('6pG/5UGJGWB9O88ykIOCYx75cjUb_R20000101T010101@proton.me');

        // multiple part-day offsets
        expect(
            getFutureRecurrenceUID(
                '9O88ykIOCYx75cjUb_R22220202T020202_R33330303T030303',
                new Date(Date.UTC(1990, 8, 13, 13, 0, 15)),
                false
            )
        ).toBe('9O88ykIOCYx75cjUb_R19900813T130015');

        // multiple all-day offsets
        expect(
            getFutureRecurrenceUID(
                '9O88ykIOCYx75cjUb_R22220202_R33330303',
                new Date(Date.UTC(1990, 8, 13, 13, 0, 15)),
                true
            )
        ).toBe('9O88ykIOCYx75cjUb_R19900813');

        // multiple mixed offsets
        expect(
            getFutureRecurrenceUID(
                '9O@8@8yk_R22220202T020202_R33330303@google.com',
                new Date(Date.UTC(2000, 1, 1, 0, 0, 0)),
                false
            )
        ).toBe('9O@8@8yk_R20000101T000000@google.com');

        expect(
            getFutureRecurrenceUID(
                '9O@8@8yk_R22220202T020202_R33330303_R44440404T040404@google.com',
                new Date(Date.UTC(2000, 1, 1, 0, 0, 0)),
                true
            )
        ).toBe('9O@8@8yk_R20000101@google.com');

        expect(
            getFutureRecurrenceUID(
                '9O@8@8yk_R11110101_R22220202T020202_R33330303_R44440404T040404@google.com',
                new Date(Date.UTC(2000, 1, 1, 0, 0, 0)),
                false
            )
        ).toBe('9O@8@8yk_R20000101T000000@google.com');

        // multiple badly mixed offsets
        expect(
            getFutureRecurrenceUID(
                '9O_R44440404T040404@8@8yk_R22220202_R33330303T030303@google.com',
                new Date(Date.UTC(2000, 1, 1, 0, 0, 0))
            )
        ).toBe('9O_R44440404T040404@8@8yk_R20000101T000000@google.com');
    });

    it('should replace recurrence offset(s) for long uids with previous offset', () => {
        const chars180 =
            'tenchars01tenchars02tenchars03tenchars04tenchars05tenchars06tenchars07tenchars08tenchars09tenchars10tenchars11tenchars12tenchars13tenchars14tenchars15tenchars16tenchars17tenchars18';
        const domain = '@proton.me';
        const expectedOffsetPartday = '_R20000101T010101';
        const expectedOffsetAllday = '_R20000101';

        expect(
            getFutureRecurrenceUID(
                `${chars180}_R22220202T020202_R33330303T030303${domain}`,
                new Date(Date.UTC(2000, 1, 1, 1, 1, 1)),
                false
            )
        ).toBe(
            `${chars180.slice(
                chars180.length + expectedOffsetPartday.length + domain.length - MAX_CHARS_API.UID
            )}${expectedOffsetPartday}${domain}`
        );

        expect(
            getFutureRecurrenceUID(
                `${chars180}_R22220202T020202_R33330303T030303${domain}`,
                new Date(Date.UTC(2000, 1, 1, 1, 1, 1)),
                true
            )
        ).toBe(
            `${chars180.slice(
                chars180.length + expectedOffsetAllday.length + domain.length - MAX_CHARS_API.UID
            )}${expectedOffsetAllday}${domain}`
        );

        // real-life examples
        expect(
            getFutureRecurrenceUID(
                'pEZO1MmPI87KEexIjCGcHQVz4yP8_R20210828T000000_R20210829T000000_R20210830T000000_R20210901T000000_R20210902T000000_R20210903T000000_R20210905T000000_R20210906T000000_R20210907T000000@proton.me',
                new Date(Date.UTC(2000, 1, 1, 1, 1, 1)),
                false
            )
        ).toBe('pEZO1MmPI87KEexIjCGcHQVz4yP8_R20000101T010101@proton.me');

        expect(
            getFutureRecurrenceUID(
                '07e673fo4slrlb4tvaadrh0bjv_R20200720_R20200621T000000_R20200622T000000_R20200623T000000_R20200624T000000_R20200625T000000@google.com',
                new Date(Date.UTC(2000, 1, 1, 1, 1, 1)),
                true
            )
        ).toBe('07e673fo4slrlb4tvaadrh0bjv_R20000101@google.com');
    });
});

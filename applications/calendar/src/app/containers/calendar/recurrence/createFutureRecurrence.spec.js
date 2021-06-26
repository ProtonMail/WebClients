import { getFutureRecurrenceUID } from './createFutureRecurrence';

describe('create future recurrence', () => {
    it('should append a recurrence offset', () => {
        expect(
            getFutureRecurrenceUID('6pG/5UGJGWB9O88ykIOCYx75cjUb@proton.me', new Date(Date.UTC(2000, 1, 1, 1, 1, 1)))
        ).toBe('6pG/5UGJGWB9O88ykIOCYx75cjUb_R20000101T010101@proton.me');

        expect(getFutureRecurrenceUID('9O88ykIOCYx75cjUb', new Date(Date.UTC(2000, 1, 1, 1, 1, 1)))).toBe(
            '9O88ykIOCYx75cjUb_R20000101T010101'
        );

        expect(getFutureRecurrenceUID('9O@8@8yk@google.com', new Date(Date.UTC(2000, 1, 1, 1, 1, 1)))).toBe(
            '9O@8@8yk_R20000101T010101@google.com'
        );
    });
});

import type { Filter } from '@proton/sieve/filterModel';

import { checkNameErrors } from './utils';

const filters = [{ ID: '1', Name: 'calendar reminders' }] as Filter[];
const EXISTS = 'Filter with this name already exists';

describe('checkNameErrors', () => {
    it('returns an error for an empty name', () => {
        expect(checkNameErrors(filters, '')).toBe('This field is required');
        expect(checkNameErrors(filters, '   ')).toBe('This field is required');
    });

    it('returns an error for an exact duplicate', () => {
        expect(checkNameErrors(filters, 'calendar reminders')).toBe(EXISTS);
    });

    it('returns an error for a duplicate differing only by case', () => {
        expect(checkNameErrors(filters, 'Calendar Reminders')).toBe(EXISTS);
    });

    it('returns an error for a duplicate with surrounding whitespace', () => {
        expect(checkNameErrors(filters, '  Calendar Reminders  ')).toBe(EXISTS);
    });

    it('accepts a unique name', () => {
        expect(checkNameErrors(filters, 'other')).toBe('');
    });

    it('lets an edited filter keep or case-change its own name', () => {
        expect(checkNameErrors(filters, 'calendar reminders', 'calendar reminders')).toBe('');
        expect(checkNameErrors(filters, 'Calendar Reminders', 'calendar reminders')).toBe('');
    });

    it('still flags another existing name when editing', () => {
        expect(checkNameErrors(filters, 'Calendar Reminders', 'something else')).toBe(EXISTS);
    });
});

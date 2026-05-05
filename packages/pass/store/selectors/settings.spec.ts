import { CRITERIA_MASKS } from '@proton/pass/lib/settings/pause-list';
import type { SettingsState } from '@proton/pass/store/reducers/settings';
import { getInitialSettings } from '@proton/pass/store/reducers/settings';
import type { State } from '@proton/pass/store/types';

import { selectPauseListEntries } from './settings';

const mockState = (settings: Partial<SettingsState>): State =>
    ({
        settings: {
            createdItemsCount: 0,
            lockMode: 0,
            ...getInitialSettings(),
            ...settings,
        },
    }) as State;

describe('`selectPauseListEntries`', () => {
    test('returns only user entries when orgDomains is undefined', () => {
        const state = mockState({ disallowedDomains: { 'user.com': CRITERIA_MASKS.Autofill } });
        const entries = selectPauseListEntries(state);
        expect(entries).toEqual([['user.com', CRITERIA_MASKS.Autofill]]);
    });

    test('returns only org entries when `disallowedDomains` is empty', () => {
        const state = mockState({ disallowedDomains: {}, orgDomains: { 'org.com': CRITERIA_MASKS.Autosave } });
        const entries = selectPauseListEntries(state);
        expect(entries).toEqual([['org.com', CRITERIA_MASKS.Autosave]]);
    });

    test('Applies `OR` to masks for shared hostname', () => {
        const state = mockState({
            disallowedDomains: { 'shared.com': CRITERIA_MASKS.Autofill },
            orgDomains: { 'shared.com': CRITERIA_MASKS.Autosave },
        });
        const entries = Object.fromEntries(selectPauseListEntries(state));
        expect(entries['shared.com']).toBe(CRITERIA_MASKS.Autofill | CRITERIA_MASKS.Autosave);
    });

    test('combines non-overlapping user and org entries without mutation', () => {
        const disallowedDomains = { 'user.com': CRITERIA_MASKS.Autofill };
        const orgDomains = { 'org.com': CRITERIA_MASKS.Autosave };
        const state = mockState({ disallowedDomains, orgDomains });

        const entries = Object.fromEntries(selectPauseListEntries(state));
        expect(entries['user.com']).toBe(CRITERIA_MASKS.Autofill);
        expect(entries['org.com']).toBe(CRITERIA_MASKS.Autosave);

        expect(disallowedDomains).toEqual({ 'user.com': CRITERIA_MASKS.Autofill });
        expect(orgDomains).toEqual({ 'org.com': CRITERIA_MASKS.Autosave });
    });
});

import { CRITERIA_MASKS } from '@proton/pass/lib/settings/pause-list';
import { getOrganizationPauseList } from '@proton/pass/store/actions/creators/organization';
import { uniqueId } from '@proton/pass/utils/string/unique-id';

import reducer from './settings';

const initialState = () => reducer(undefined, { type: '@@INIT' });

describe('settings reducer — orgDomains', () => {
    test('orgDomains is `undefined` in initial state', () => {
        expect(initialState().orgDomains).toBeUndefined();
    });

    test('`getOrganizationPauseList.success` sets orgDomains', () => {
        const payload = { 'example.com': CRITERIA_MASKS.Autofill };
        const action = getOrganizationPauseList.success(uniqueId(), payload);
        const state = reducer(initialState(), action);
        expect(state.orgDomains).toEqual(payload);
    });

    test('`getOrganizationPauseList.success` replaces existing `orgDomains`', () => {
        const first = { 'old.com': CRITERIA_MASKS.Autosave };
        const second = { 'new.com': CRITERIA_MASKS.Autofill };
        const state1 = reducer(initialState(), getOrganizationPauseList.success(uniqueId(), first));
        const state2 = reducer(state1, getOrganizationPauseList.success(uniqueId(), second));
        expect(state2.orgDomains?.['new.com']).toBe(CRITERIA_MASKS.Autofill);
        expect(state2.orgDomains?.['old.com']).toBe(undefined);
    });
});

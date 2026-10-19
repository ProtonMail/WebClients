import type { EnhancedMember } from '@proton/shared/lib/interfaces';

import type { MembersState } from '../members';
import { selectMembersRequiringOrgKeyDemotion } from './selectors';

const getState = (members: Partial<EnhancedMember>[]) => ({ members: { value: members } }) as unknown as MembersState;

describe('selectMembersRequiringOrgKeyDemotion', () => {
    it('lists the members requiring org key demotion, except the current user and scheduled ones', () => {
        const state = getState([
            { ID: 'flagged', Self: 0, requiresOrgKeyDemotion: true, hasScheduledOrgKeyDemotion: false },
            { ID: 'not-flagged', Self: 0, requiresOrgKeyDemotion: false, hasScheduledOrgKeyDemotion: false },
            { ID: 'scheduled', Self: 0, requiresOrgKeyDemotion: true, hasScheduledOrgKeyDemotion: true },
            { ID: 'self', Self: 1, requiresOrgKeyDemotion: true, hasScheduledOrgKeyDemotion: false },
        ]);

        expect(selectMembersRequiringOrgKeyDemotion(state).map(({ ID }) => ID)).toEqual(['flagged']);
    });

    it('lists nothing while members are not loaded', () => {
        expect(selectMembersRequiringOrgKeyDemotion({ members: {} } as unknown as MembersState)).toEqual([]);
    });
});

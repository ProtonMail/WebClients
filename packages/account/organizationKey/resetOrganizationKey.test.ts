import { MEMBER_PRIVATE } from '@proton/shared/lib/constants';
import type { EnhancedMember } from '@proton/shared/lib/interfaces';

import { getMembersToPrivatizeForOrganizationKeyReset } from './resetOrganizationKey';

const getMember = (member: Partial<EnhancedMember>) =>
    ({ Private: MEMBER_PRIVATE.READABLE, PublicKey: 'public-key', ...member }) as EnhancedMember;

describe('getMembersToPrivatizeForOrganizationKeyReset', () => {
    it('should include non-private members who are set up', () => {
        const members = [getMember({ ID: '1' }), getMember({ ID: '2', Self: 1 })];
        expect(getMembersToPrivatizeForOrganizationKeyReset(members)).toEqual(members);
    });

    it('should skip private members', () => {
        const members = [getMember({ ID: '1', Private: MEMBER_PRIVATE.UNREADABLE })];
        expect(getMembersToPrivatizeForOrganizationKeyReset(members)).toEqual([]);
    });

    it('should skip SSO members who are not set up', () => {
        const setUp = getMember({ ID: '1' });
        const members = [setUp, getMember({ ID: '2', SSO: 1, PublicKey: '' })];
        expect(getMembersToPrivatizeForOrganizationKeyReset(members)).toEqual([setUp]);
    });

    it('should skip members who never finished setup', () => {
        const setUp = getMember({ ID: '1' });
        const members = [setUp, getMember({ ID: '2', SSO: 0, PublicKey: '' })];
        expect(getMembersToPrivatizeForOrganizationKeyReset(members)).toEqual([setUp]);
    });
});

import type { Share } from '@proton/pass/types';
import { ShareRole, ShareType } from '@proton/pass/types';

export const createTestShare = (overrides: Partial<Share> = {}): Share => ({
    shareId: 'share',
    vaultId: 'v',
    targetId: '1',
    targetType: ShareType.Vault,
    shareRoleId: ShareRole.READ,
    permission: 0,
    flags: 0,
    addressId: undefined,
    content: { name: 'Test', description: '', display: {} },
    createTime: 0,
    canAutofill: undefined,
    newUserInvitesReady: 0,
    owner: false,
    shared: false,
    targetMaxMembers: 10,
    targetMembers: 1,
    eventId: 'event-1',
    groupId: null,
    ...overrides,
    ...overrides,
});

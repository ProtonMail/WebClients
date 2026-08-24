import { ApiError } from '@proton/shared/lib/fetch/ApiError';

import type { Share } from '../../types';
import { ShareRole, ShareType } from '../../types';
import { PassErrorCode } from '../api/errors';

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

export const createShareRemovedError = (code: PassErrorCode = PassErrorCode.NOT_EXIST_SHARE) => {
    const data = { Code: code, Error: '[TEST] Share Removed' };
    const err = new ApiError(data.Error, 422, 'StatusCodeError');
    err.data = data;
    return err;
};

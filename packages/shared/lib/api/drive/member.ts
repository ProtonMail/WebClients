import { SHARE_MEMBER_PERMISSIONS } from '../../drive/constants';

//TODO: Add pagination
export const queryShareMemberListing = (shareId: string) => ({
    method: 'get',
    url: `/drive/v2/shares/${shareId}/members`,
});

export const queryRemoveShareMember = (shareId: string, memberId: string) => ({
    method: 'delete',
    url: `drive/v2/shares/${shareId}/members/${memberId}`,
});

export const queryUpdateShareMemberPermissions = (
    shareId: string,
    memberId: string,
    Permissions: SHARE_MEMBER_PERMISSIONS
) => ({
    method: 'put',
    url: `drive/v2/shares/${shareId}/members/${memberId}`,
    data: {
        Permissions,
    },
});

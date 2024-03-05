import { SHARE_MEMBER_PERMISSIONS } from '../../drive/constants';

//TODO: Add pagination
export const queryShareMemberListing = (volumeId: string, shareId: string) => ({
    method: 'get',
    url: `drive/v2/volumes/${volumeId}/shares/${shareId}/members`,
});

//TODO: Add pagination
export const queryShareMemberDetails = (volumeId: string, shareId: string, { MemberIDs }: { MemberIDs: string[] }) => ({
    method: 'post',
    url: `drive/v2/volumes/${volumeId}/shares/${shareId}/invitations`,
    data: {
        MemberIDs,
    },
});

export const queryRemoveShareMember = (volumeId: string, shareId: string, { MemberId }: { MemberId: string }) => ({
    method: 'delete',
    url: `drive/v2/volumes/${volumeId}/shares/${shareId}/members/${MemberId}`,
});

export const queryUpdateShareMemberPermissions = (
    volumeId: string,
    shareId: string,
    { Members }: { Members: { MemberID: string; Permissions: SHARE_MEMBER_PERMISSIONS }[] }
) => ({
    method: 'put',
    url: `drive/v2/volumes/${volumeId}/shares/${shareId}/members/permissions`,
    data: {
        Members,
    },
});

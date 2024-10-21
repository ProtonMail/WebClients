import { HTTP_STATUS_CODE } from '@proton/shared/lib/constants';

import { EXPENSIVE_REQUEST_TIMEOUT } from '../../drive/constants';
import { API_CUSTOM_ERROR_CODES } from '../../errors';
import type { MoveLink } from '../../interfaces/drive/link';
import type { CreateDrivePhotosShare, CreateDriveShare } from '../../interfaces/drive/share';

export const queryCreateShare = (volumeID: string, data: CreateDriveShare) => ({
    method: 'post',
    url: `drive/volumes/${volumeID}/shares`,
    data,
});
export const queryCreatePhotosShare = (volumeID: string, data: CreateDrivePhotosShare) => ({
    method: 'post',
    url: `drive/volumes/${volumeID}/photos/share`,
    data,
});

export const queryUserShares = (ShowAll = 1) => ({
    method: 'get',
    url: 'drive/shares',
    silence: true,
    params: { ShowAll },
});

export const queryShareMeta = (shareID: string) => ({
    method: `get`,
    url: `drive/shares/${shareID}`,
    silence: [API_CUSTOM_ERROR_CODES.NOT_ALLOWED],
});

export const queryRenameLink = (
    shareID: string,
    linkID: string,
    data: { Name: string; MIMEType?: string; Hash: string; SignatureAddress: string; OriginalHash: string }
) => ({
    method: `put`,
    url: `drive/shares/${shareID}/links/${linkID}/rename`,
    data,
});

export const queryMoveLink = (shareID: string, linkID: string, data: MoveLink) => ({
    method: 'put',
    url: `drive/shares/${shareID}/links/${linkID}/move`,
    data,
});

export const queryEvents = (shareID: string, eventID: string) => ({
    timeout: EXPENSIVE_REQUEST_TIMEOUT,
    url: `drive/shares/${shareID}/events/${eventID}`,
    method: 'get',
});

export const queryLatestEvents = (shareID: string) => ({
    url: `drive/shares/${shareID}/events/latest`,
    method: 'get',
});

export const queryDeleteShare = (
    shareID: string,
    { Force, silence }: { Force?: 0 | 1; silence?: boolean } = { Force: 0 }
) => ({
    url: `drive/shares/${shareID}`,
    method: 'delete',
    params: {
        Force,
    },
    silence,
});
export const queryShareMembers = (shareID: string) => ({
    url: `drive/shares/${shareID}/members`,
    method: 'get',
});

export const queryRemoveShareMember = (shareID: string, memberID: string) => ({
    method: 'delete',
    url: `drive/shares/${shareID}/members/${memberID}`,
});

export const queryAcceptShareInvite = (
    shareID: string,
    memberID: string,
    {
        AddressID,
        AddressKeyID,
        SessionKeySignature,
    }: {
        AddressID: string;
        AddressKeyID: string;
        SessionKeySignature: string;
    }
) => ({
    method: 'post',
    url: `drive/shares/${shareID}/members/invitations/${memberID}`,
    data: {
        AddressID,
        AddressKeyID,
        SessionKeySignature,
    },
});

/* Shares migration */
export const queryUnmigratedShares = () => ({
    url: 'drive/migrations/shareaccesswithnode/unmigrated',
    method: 'get',
    silence: [HTTP_STATUS_CODE.NOT_FOUND],
});

export const queryMigrateLegacyShares = (data: {
    PassphraseNodeKeyPackets: { PassphraseNodeKeyPacket: string; ShareID: string }[];
    UnreadableShareIDs?: string[];
}) => ({
    url: 'drive/migrations/shareaccesswithnode',
    method: 'post',
    data,
    silence: [HTTP_STATUS_CODE.NOT_FOUND],
});

export const queryResolveContextShare = ({ volumeId, linkId }: { volumeId: string; linkId: string }) => ({
    url: `drive/volumes/${volumeId}/links/${linkId}/context`,
    method: 'get',
});

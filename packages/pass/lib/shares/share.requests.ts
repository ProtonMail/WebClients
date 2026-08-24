import type { SharesState } from '../../store/reducers';
import type {
    ActiveShareGetResponse,
    PassEventListResponse,
    Share,
    ShareGetResponse,
    ShareHideUnhideBatchRequest,
    ShareId,
    ShareRole,
    ShareType,
} from '../../types';
import type { ShareEditMemberAccessIntent, ShareRemoveMemberAccessIntent } from '../../types/data/access.dto';
import type { ShareMember } from '../../types/data/invites';
import { truthy } from '../../utils/fp/predicates';
import { api } from '../api/api';
import { parseShareResponse } from './share.parser';

export { getAllShareKeys, getShareLatestEventId } from './share.keys';

export const getSharesQuery = () => ({ url: 'pass/v1/share', method: 'get' }) as const;
export const getShares = async () => {
    const res = await api(getSharesQuery());
    return res.Shares;
};

export const getShareEventsQuery = (shareId: ShareId, eventId: string) =>
    ({ url: `pass/v1/share/${shareId}/event/${eventId}`, method: 'get' }) as const;
export const getShareEvents = async (shareId: ShareId, eventId: string): Promise<PassEventListResponse> => {
    const res = await api(getShareEventsQuery(shareId, eventId));
    return res.Events;
};

export const requestShares = async (): Promise<ShareGetResponse[]> =>
    (
        await api({
            url: 'pass/v1/share',
            method: 'get',
        })
    ).Shares;

export const requestShare = async (shareId: string, EventToken?: string) =>
    (await api({ url: `pass/v1/share/${shareId}`, method: 'get', params: { EventToken } })).Share;

export const deleteShare = async (shareId: string) => api({ url: `pass/v1/share/${shareId}`, method: 'delete' });

const mapShareMembers = (response: ActiveShareGetResponse[]) =>
    response.map((member) => ({
        shareId: member.ShareID,
        name: member.UserName,
        email: member.UserEmail,
        owner: member.Owner,
        targetType: member.TargetType,
        targetId: member.TargetID,
        shareRoleId: member.ShareRoleID as ShareRole,
        expireTime: member.ExpireTime,
        createTime: member.CreateTime,
        isGroupShare: member.IsGroupShare,
    }));

export const loadItemMembers = async (shareId: string, itemId: string): Promise<ShareMember[]> =>
    api({ url: `pass/v1/share/${shareId}/user/item/${itemId}`, method: 'get' }).then((r) => mapShareMembers(r.Shares));

export const loadVaultMembers = async (shareId: string): Promise<ShareMember[]> =>
    api({ url: `pass/v1/share/${shareId}/user`, method: 'get' }).then((r) => mapShareMembers(r.Shares));

export const removeUserAccess = async ({ shareId, userShareId }: ShareRemoveMemberAccessIntent) =>
    api({
        url: `pass/v1/share/${shareId}/user/${userShareId}`,
        method: 'delete',
    });

export const editMemberAccess = async ({ shareId, userShareId, shareRoleId }: ShareEditMemberAccessIntent) =>
    api({
        url: `pass/v1/share/${shareId}/user/${userShareId}`,
        method: 'put',
        data: { ShareRoleID: shareRoleId, ExpireTime: null },
    });

/** Pass full `SharesState` to reuse existing event IDs and avoid
 * redundant API calls in `parseShareResponse` for each share */
export const toggleVisibility = async (
    SharesToHide: ShareId[],
    SharesToUnhide: ShareId[],
    shares: SharesState
): Promise<Share<ShareType.Vault>[]> => {
    const encryptedShares = (
        await api({
            url: `pass/v1/share/hide`,
            method: 'put',
            data: { SharesToHide, SharesToUnhide } satisfies ShareHideUnhideBatchRequest,
        })
    ).Shares;

    return (
        await Promise.all(
            encryptedShares.map((share) =>
                parseShareResponse<ShareType.Vault>(share, {
                    eventId: shares[share.ShareID]?.eventId,
                })
            )
        )
    ).filter(truthy);
};

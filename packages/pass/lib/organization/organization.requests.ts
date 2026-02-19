import { api } from '@proton/pass/lib/api/api';
import { createPageIterator } from '@proton/pass/lib/api/utils';
import type { OrganizationState } from '@proton/pass/store/reducers/organization';
import type {
    MaybeNull,
    MemberMonitorReportList,
    OrganizationGetResponse,
    OrganizationUpdatePasswordPolicyInput,
    OrganizationUrlPauseEntryDto,
} from '@proton/pass/types';
import type { GroupMembersGetResponse, GroupsGetResponse } from '@proton/pass/types/api/core';
import type { OrganizationSettings } from '@proton/pass/types/data/organization';
import { logger } from '@proton/pass/utils/logger';
import { getGroupMembers as coreGetGroupMembers, getGroups } from '@proton/shared/lib/api/groups';
import { getOrganization as coreGetOrganization, getOrganizationKeys } from '@proton/shared/lib/api/organization';
import type { Organization, OrganizationKey } from '@proton/shared/lib/interfaces';

import type { OrganizationReportDTO, PauseListEntryAddDTO, PauseListEntryUpdateDTO } from './types';

export const getUserOrganization = async (): Promise<MaybeNull<Organization>> => {
    try {
        logger.info(`[User] Syncing organization info`);
        return (await api<{ Organization: Organization }>(coreGetOrganization())).Organization;
    } catch {
        return null;
    }
};

export const getOrganizationSettings = async (): Promise<OrganizationGetResponse> =>
    (await api({ url: 'pass/v1/organization', method: 'get' })).Organization!;

export const setOrganizationSettings = async (
    settings: Partial<OrganizationSettings>
): Promise<OrganizationGetResponse> =>
    (
        await api({
            url: 'pass/v1/organization/settings',
            method: 'put',
            data: settings,
        })
    ).Organization!;

export const getOrganizationGroups = async (): Promise<GroupsGetResponse> => api(getGroups());

export const getGroupMembers = async (groupId: string): Promise<GroupMembersGetResponse> =>
    api(coreGetGroupMembers(groupId));

export const getOrganizationKey = async (): Promise<OrganizationKey> => api(getOrganizationKeys());

export const getOrganization = async (loadGroups: boolean = false): Promise<MaybeNull<OrganizationState>> => {
    const organization = await getUserOrganization();
    if (!organization) return null;

    const { Settings, CanUpdate }: OrganizationGetResponse = await getOrganizationSettings();
    const groups = loadGroups ? (await getOrganizationGroups()).Groups : [];

    return {
        settings: Settings,
        canUpdate: CanUpdate,
        organization,
        groups,
    };
};

export const setPasswordGeneratorPolicySettings = async (
    settings: OrganizationUpdatePasswordPolicyInput
): Promise<OrganizationGetResponse> =>
    (
        await api({
            url: 'pass/v1/organization/settings/password_policy',
            method: 'put',
            data: settings,
        })
    ).Organization!;

export const getOrganizationReports = async ({
    page,
    pageSize,
}: OrganizationReportDTO): Promise<MemberMonitorReportList> =>
    (
        await api({
            url: 'pass/v1/organization/report',
            method: 'get',
            params: { Page: page, PageSize: pageSize },
        })
    ).Report!;

export const getUrlPauseList = async (): Promise<OrganizationUrlPauseEntryDto[]> =>
    createPageIterator({
        request: async (Since) => {
            const { Entries } = await api({
                url: 'pass/v1/organization/urlpause',
                method: 'get',
                params: Since ? { Since } : {},
            });

            return { data: Entries.Entries ?? [], cursor: Entries.LastID };
        },
    })();

export const addUrlPauseListEntry = async (data: PauseListEntryAddDTO): Promise<OrganizationUrlPauseEntryDto> =>
    (
        await api({
            url: 'pass/v1/organization/urlpause',
            method: 'post',
            data: {
                Url: data.url,
                Values: data.values,
            },
        })
    ).Entry;

export const updateUrlPauseListEntry = async (data: PauseListEntryUpdateDTO) =>
    api({
        url: `pass/v1/organization/urlpause/${data.id}`,
        method: 'put',
        data: { ...data.values },
    });

export const deleteUrlPauseListEntry = async (id: string) =>
    api({
        url: `pass/v1/organization/urlpause/${id}`,
        method: 'delete',
    });

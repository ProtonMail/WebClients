import type { Api } from '../interfaces';
import type { MspSubsidiary } from '../interfaces/MspSubsidiary';
import queryPages from './helpers/queryPages';
import type { PaginationParams } from './interface';

export const getMspSubsidiaries = (params?: PaginationParams) => ({
    method: 'get',
    url: 'core/v4/organizations/subsidiaries',
    params,
});

export const getMspBillingSummary = (mspId: string) => ({
    method: 'get',
    url: `core/v4/organizations/${mspId}/subsidiaries/billing-summary/cost`,
});

export const getAllMspSubsidiaries = (api: Api) => {
    return queryPages((Page, PageSize) => {
        return api<{ Organizations: MspSubsidiary[]; Total: number }>(getMspSubsidiaries({ Page, PageSize }));
    }).then((pages) => pages.flatMap(({ Organizations }) => Organizations));
};

export interface CreateMspSubsidiaryData {
    Name: string;
    MaxMembers: number;
    ParentOrgToken: string;
    ParentOrgSignature: string;
    PrivateKey: string;
}

export const createMspSubsidiary = (data: CreateMspSubsidiaryData) => ({
    method: 'post',
    url: 'core/v4/organizations/subsidiaries',
    data,
});

export const updateMspSubsidiary = (id: string, data: { Name: string; MaxMembers: number }) => ({
    method: 'put',
    url: `core/v4/organizations/subsidiaries/${id}`,
    data,
});

export const enableMspSubsidiary = (id: string) => ({
    method: 'post',
    url: `core/v4/organizations/subsidiaries/${id}/enable`,
});

export const disableMspSubsidiary = (id: string) => ({
    method: 'post',
    url: `core/v4/organizations/subsidiaries/${id}/disable`,
});

export interface AssignMspSubsidiaryData {
    OrganizationKeyActivation: {
        TokenKeyPacket: string;
        Signature: string;
    };
}

export const assignMspSubsidiaryManager = (id: string, memberId: string, data: AssignMspSubsidiaryData) => ({
    method: 'post',
    url: `organizations/subsidiaries/${id}/delegated-managers/${memberId}`,
    data,
});

export const unassignMspSubsidiaryManager = (id: string, memberId: string) => ({
    method: 'delete',
    url: `organizations/subsidiaries/${id}/members/${memberId}`,
});

export interface MspDelegatedManager {
    ID: string;
    Name: string;
    PublicKey: string;
}

export const getMspSubsidiaryManagers = (id: string) => ({
    method: 'get',
    url: `organizations/subsidiaries/${id}/members`,
});

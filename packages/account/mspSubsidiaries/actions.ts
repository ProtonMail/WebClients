import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import type { KtState } from '@proton/account/kt';
import type { MemberState } from '@proton/account/member';
import { mspSubsidiariesActions } from '@proton/account/mspSubsidiaries';
import { type OrganizationKeyState, organizationKeyThunk } from '@proton/account/organizationKey';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import {
    createMspSubsidiary,
    disableMspSubsidiary,
    enableMspSubsidiary,
    getMspSubsidiaryManagers,
    unassignMspSubsidiaryManager,
    updateMspSubsidiary,
} from '@proton/shared/lib/api/msp';
import type { MspDelegatedManager } from '@proton/shared/lib/api/msp';
import { DEFAULT_KEYGEN_TYPE, KEYGEN_CONFIGS } from '@proton/shared/lib/constants';
import type { MspSubsidiary } from '@proton/shared/lib/interfaces/MspSubsidiary';
import { MSP_SUBSIDIARY_STATUS } from '@proton/shared/lib/interfaces/MspSubsidiary';
import { generateSubsidiaryOrganizationKeys } from '@proton/shared/lib/keys/organizationKeys';

type RequiredState = OrganizationKeyState & MemberState & KtState;
export const addCompanyThunk = ({
    data,
}: {
    data: {
        name: string;
        assignedSeats: number;
    };
}): ThunkAction<Promise<void>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        const api = extra.api;
        const organizationKey = await dispatch(organizationKeyThunk());
        const adminOrgKey = organizationKey?.privateKey;
        if (!adminOrgKey) {
            throw new Error(c('Error').t`Please set up your organization before adding a company.`);
        }
        const keyGenConfig = KEYGEN_CONFIGS[DEFAULT_KEYGEN_TYPE];
        const cryptoPayload = await generateSubsidiaryOrganizationKeys({ adminOrgKey, keyGenConfig });
        const { Organization } = await api<{ Organization: MspSubsidiary }>(
            createMspSubsidiary({ Name: data.name, MaxMembers: data.assignedSeats, ...cryptoPayload })
        );
        // The API seems to return OrganizationID instead of ID. Fixup the value here.
        if ('OrganizationID' in Organization && typeof Organization.OrganizationID === 'string') {
            Organization.ID = Organization.OrganizationID;
            delete Organization.OrganizationID;
        }
        dispatch(mspSubsidiariesActions.upsert(Organization));
    };
};

export const updateCompanyThunk = ({
    id,
    data,
}: {
    id: string;
    data: {
        name: string;
        assignedSeats: number;
    };
}): ThunkAction<Promise<void>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        const api = extra.api;
        await api(updateMspSubsidiary(id, { Name: data.name, MaxMembers: data.assignedSeats }));
        dispatch(mspSubsidiariesActions.patch({ id, changes: { Name: data.name, MaxMembers: data.assignedSeats } }));
    };
};

export const setCompanyStatusThunk = ({
    id,
    status,
}: {
    id: string;
    status: 'active' | 'disabled' | 'on-hold';
}): ThunkAction<Promise<void>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        const api = extra.api;
        if (status === 'active') {
            await api(enableMspSubsidiary(id));
            dispatch(mspSubsidiariesActions.setStatus({ id, status: MSP_SUBSIDIARY_STATUS.ACTIVE }));
        } else if (status === 'disabled') {
            await api(disableMspSubsidiary(id));
            dispatch(mspSubsidiariesActions.setStatus({ id, status: MSP_SUBSIDIARY_STATUS.DISABLED }));
        } else {
            throw new Error('Unsupported status');
        }
    };
};

export const getSubsidiaryManagersThunk = ({
    id,
}: {
    id: string;
}): ThunkAction<Promise<MspDelegatedManager[]>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (_dispatch, _, extra) => {
        const { DelegatedManagers } = await extra.api<{ DelegatedManagers: MspDelegatedManager[] }>(
            getMspSubsidiaryManagers(id)
        );
        return DelegatedManagers;
    };
};

export const unassignMemberFromCompanyThunk = ({
    id,
    memberId,
}: {
    id: string;
    memberId: string;
}): ThunkAction<Promise<void>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (_dispatch, _, extra) => {
        await extra.api(unassignMspSubsidiaryManager(id, memberId));
    };
};

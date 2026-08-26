import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import {
    createMspSubsidiary,
    disableMspSubsidiary,
    enableMspSubsidiary,
    getAllMspSubsidiaryManagers,
    unassignMspSubsidiaryManager,
    updateMspSubsidiary,
} from '@proton/shared/lib/api/msp';
import type { MspDelegatedManager } from '@proton/shared/lib/api/msp';
import { DEFAULT_KEYGEN_TYPE, KEYGEN_CONFIGS, ORGANIZATION_STATE } from '@proton/shared/lib/constants';
import type { MspSubsidiary } from '@proton/shared/lib/interfaces/Msp';
import { generateSubsidiaryOrganizationKeys } from '@proton/shared/lib/keys/organizationKeys';

import { type AddressKeysState, addressKeysThunk } from '../addressKeys';
import { addressesThunk } from '../addresses';
import type { KtState } from '../kt';
import type { MemberState } from '../member';
import { type OrganizationKeyState, organizationKeyThunk } from '../organizationKey';
import { userOrganizationsActions } from '../userOrganizations';
import { mspSubsidiariesActions } from './index';

type RequiredState = OrganizationKeyState & MemberState & KtState & AddressKeysState;
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

        // Subsidiaries inherit the MSP's own organization identity: the same address that signed
        // the parent org's key fingerprint also signs the new subsidiary's key fingerprint.
        const identityAddressEmail = organizationKey.Key.FingerprintSignatureAddress;
        const addresses = await dispatch(addressesThunk());
        const identityAddress = addresses.find((address) => address.Email === identityAddressEmail);
        const [identityAddressKey] = identityAddress
            ? await dispatch(addressKeysThunk({ addressID: identityAddress.ID }))
            : [];
        if (!identityAddress || !identityAddressKey?.privateKey) {
            throw new Error(c('Error').t`Please set up your organization identity before adding a company.`);
        }

        const keyGenConfig = KEYGEN_CONFIGS[DEFAULT_KEYGEN_TYPE];
        const cryptoPayload = await generateSubsidiaryOrganizationKeys({
            adminOrgKey,
            signingAddressKey: identityAddressKey.privateKey,
            keyGenConfig,
        });
        const { Organization } = await api<{ Organization: MspSubsidiary }>(
            createMspSubsidiary({
                Name: data.name,
                MaxMembers: data.assignedSeats,
                OrganizationIdentityAddressID: identityAddress.ID,
                ...cryptoPayload,
            })
        );
        // The API seems to return OrganizationID instead of ID. Fixup the value here.
        if ('OrganizationID' in Organization && typeof Organization.OrganizationID === 'string') {
            Organization.ID = Organization.OrganizationID;
            delete Organization.OrganizationID;
        }
        // The API seems to return State instead of Status. Fixup the value here.
        if ('State' in Organization && typeof Organization.State === 'number') {
            Organization.Status = Organization.State as ORGANIZATION_STATE;
            delete Organization.State;
        }
        // A brand new subsidiary has no delegated managers yet.
        Organization.DelegatedManagers ??= [];
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
        // IT managers see this company via the userOrganizations cache instead of mspSubsidiaries, so patch both.
        dispatch(mspSubsidiariesActions.patch({ id, changes: { Name: data.name, MaxMembers: data.assignedSeats } }));
        dispatch(
            userOrganizationsActions.patch({
                id,
                changes: { OrganizationName: data.name, MaxMembers: data.assignedSeats },
            })
        );
    };
};

export const setCompanyStatusThunk = ({
    id,
    status,
}: {
    id: string;
    status: ORGANIZATION_STATE;
}): ThunkAction<Promise<void>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        const api = extra.api;
        if (status === ORGANIZATION_STATE.ACTIVE) {
            await api(enableMspSubsidiary(id));
        } else {
            await api(disableMspSubsidiary(id));
        }
        dispatch(mspSubsidiariesActions.setStatus({ id, status }));
    };
};

export const getSubsidiaryManagersThunk = ({
    id,
}: {
    id: string;
}): ThunkAction<Promise<MspDelegatedManager[]>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (_dispatch, _, extra) => {
        return getAllMspSubsidiaryManagers(extra.api, id);
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

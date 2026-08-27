import type { PrivateKeyReference } from '@protontech/crypto';
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
import { DEFAULT_KEYGEN_TYPE, KEYGEN_CONFIGS, MEMBER_PRIVATE, ORGANIZATION_STATE } from '@proton/shared/lib/constants';
import type { Address, KeyPair } from '@proton/shared/lib/interfaces';
import type { MspSubsidiary } from '@proton/shared/lib/interfaces/Msp';
import { getPrimaryKey } from '@proton/shared/lib/keys/getPrimaryKey';
import { getMemberKeys } from '@proton/shared/lib/keys/memberKeys';
import { generateSubsidiaryOrganizationKeys } from '@proton/shared/lib/keys/organizationKeys';

import { type AddressKeysState, addressKeysThunk } from '../addressKeys';
import { addressesThunk } from '../addresses';
import type { KtState } from '../kt';
import type { MemberState } from '../member';
import { type MembersState, getMemberAddresses, membersThunk } from '../members';
import { type OrganizationKeyState, organizationKeyThunk } from '../organizationKey';
import { userOrganizationsActions } from '../userOrganizations';
import { mspSubsidiariesActions } from './index';

type RequiredState = OrganizationKeyState & MemberState & MembersState & KtState & AddressKeysState;

/**
 * Resolves the address key that signs a subsidiary's organization key fingerprint. The organization
 * identity address usually belongs to the current user, but it can also belong to another
 * (non-private) member, in which case their keys are decrypted through the organization key.
 */
const getOrganizationIdentityAddressKey = ({
    identityAddressEmail,
    organizationKey,
}: {
    identityAddressEmail: string | null | undefined;
    organizationKey: KeyPair;
}): ThunkAction<
    Promise<{ address: Address; privateKey: PrivateKeyReference } | undefined>,
    RequiredState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch) => {
        if (!identityAddressEmail) {
            return;
        }

        const addresses = await dispatch(addressesThunk());
        const ownAddress = addresses.find((address) => address.Email === identityAddressEmail);
        if (ownAddress) {
            const [ownAddressKey] = await dispatch(addressKeysThunk({ addressID: ownAddress.ID }));
            if (ownAddressKey?.privateKey) {
                return { address: ownAddress, privateKey: ownAddressKey.privateKey };
            }
            return;
        }

        const members = await dispatch(membersThunk());
        for (const member of members) {
            // Only non-private members with keys have tokens encrypted to the organization key,
            // so they're the only ones whose signing key can be recovered here.
            if (member.Self || member.Private !== MEMBER_PRIVATE.READABLE || !member.Keys?.length) {
                continue;
            }
            if (member.Addresses && !member.Addresses.some((address) => address.Email === identityAddressEmail)) {
                continue;
            }
            const memberAddresses = await dispatch(getMemberAddresses({ member, retry: true }));
            const memberAddress = memberAddresses.find((address) => address.Email === identityAddressEmail);
            if (!memberAddress) {
                continue;
            }
            const { memberAddressesKeys } = await getMemberKeys({
                member,
                memberAddresses: [memberAddress],
                organizationKey,
            });
            const privateKey = getPrimaryKey(memberAddressesKeys[0]?.keys)?.privateKey;
            if (privateKey) {
                return { address: memberAddress, privateKey };
            }
            return;
        }
    };
};

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
        if (!organizationKey?.privateKey) {
            throw new Error(c('Error').t`Please set up your organization before adding a company.`);
        }
        const adminOrgKey = organizationKey.privateKey;

        // Subsidiaries inherit the MSP's own organization identity: the same address that signed
        // the parent org's key fingerprint also signs the new subsidiary's key fingerprint.
        const identity = await dispatch(
            getOrganizationIdentityAddressKey({
                identityAddressEmail: organizationKey.Key.FingerprintSignatureAddress,
                organizationKey,
            })
        );
        if (!identity) {
            throw new Error(c('Error').t`Please set up your organization identity before adding a company.`);
        }

        const keyGenConfig = KEYGEN_CONFIGS[DEFAULT_KEYGEN_TYPE];
        const cryptoPayload = await generateSubsidiaryOrganizationKeys({
            adminOrgKey,
            signingAddressKey: identity.privateKey,
            keyGenConfig,
        });
        const { Organization } = await api<{ Organization: MspSubsidiary }>(
            createMspSubsidiary({
                Name: data.name,
                MaxMembers: data.assignedSeats,
                OrganizationIdentityAddressID: identity.address.ID,
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

import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import { getVerifiedPublicKeys } from '@proton/key-transparency/keys';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { validateOrganizationKeySignature } from '@proton/shared/lib/keys/organizationKeys';

import type { KtState } from '../kt';
import { getKTUserContext } from '../kt/actions';
import { type OrganizationKeyState, organizationKeyThunk } from './index';

export enum OrganizationSignatureState {
    publicKeys = 0,
    valid = 1,
    error = 2,
}

/**
 * Verify that the organization's fingerprint signature was made by the address it claims. Resolves
 * to undefined when the organization has no identity to verify, which callers show as no result
 * rather than as a failed verification.
 */
export const validateOrganizationIdentity = (): ThunkAction<
    Promise<OrganizationSignatureState | undefined>,
    OrganizationKeyState & KtState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, _, extra) => {
        const organizationKey = await dispatch(organizationKeyThunk());
        const armoredSignature = organizationKey?.Key.FingerprintSignature;
        const email = organizationKey?.Key.FingerprintSignatureAddress;

        if (!organizationKey?.privateKey || !armoredSignature || !email) {
            return undefined;
        }

        const verificationKeys = (
            await getVerifiedPublicKeys({
                api: getSilentApi(extra.api),
                email,
                ktUserContext: await dispatch(getKTUserContext()),
            })
        ).map(({ publicKey }) => publicKey);

        if (!verificationKeys.length) {
            return OrganizationSignatureState.publicKeys;
        }

        try {
            await validateOrganizationKeySignature({
                verificationKeys,
                organizationKey: organizationKey.privateKey,
                armoredSignature,
            });
            return OrganizationSignatureState.valid;
        } catch {
            return OrganizationSignatureState.error;
        }
    };
};

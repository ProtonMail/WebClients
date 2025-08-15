import type { UnknownAction } from '@reduxjs/toolkit';
import type { ThunkAction } from 'redux-thunk';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities';
import { addDomain, deleteDomain as deleteDomainConfig, getDomain } from '@proton/shared/lib/api/domains';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import type { Domain } from '@proton/shared/lib/interfaces';

import { type OrganizationState, organizationThunk } from '../organization';
import { type DomainsState, removeDomain, upsertDomain } from './index';

export const createDomain = ({
    name,
    allowedForSSO = false,
    allowedForMail = !allowedForSSO,
}: {
    name: string;
    allowedForSSO?: boolean;
    allowedForMail?: boolean;
}): ThunkAction<Promise<Domain>, DomainsState & OrganizationState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, getState, extra) => {
        const silentApi = getSilentApi(extra.api);
        const { Domain } = await silentApi<{ Domain: Domain }>(
            addDomain({
                Name: name,
                AllowedForMail: allowedForMail,
                AllowedForSSO: allowedForSSO,
            })
        );
        dispatch(upsertDomain(Domain));
        // Creating a domain also modifies the organization, so it needs to be refetched.
        await dispatch(organizationThunk({ cache: CacheType.None }));
        return Domain;
    };
};

export const deleteDomain = (
    domain: Domain
): ThunkAction<Promise<void>, DomainsState & OrganizationState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, getState, extra) => {
        const silentApi = getSilentApi(extra.api);
        await silentApi<{ Domain: Domain }>(deleteDomainConfig(domain.ID));
        // Removing a domain also modifies the organization, so it needs to be refetched.
        dispatch(removeDomain(domain));
        await dispatch(organizationThunk({ cache: CacheType.None }));
    };
};

export const syncDomain = (
    domain: Domain
): ThunkAction<Promise<Domain>, DomainsState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, getState, extra) => {
        const silentApi = getSilentApi(extra.api);

        // Fetching the domain to ensure we have the latest data. It triggers a verification update.
        const { Domain } = await silentApi<{ Domain: Domain }>(getDomain(domain.ID, true));

        dispatch(upsertDomain(Domain));
        return Domain;
    };
};

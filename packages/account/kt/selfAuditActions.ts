import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import type { SelfAuditResult } from '@proton/key-transparency/interfaces';
import { runSelfAudit } from '@proton/key-transparency/shared/runSelfAudit';
import { loadSelfAuditResult, storeSelfAuditResult } from '@proton/key-transparency/storage/selfAuditResult';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import { CacheType } from '@proton/redux-utilities/interface';

import { type AddressKeysState, addressKeysThunk } from '../addressKeys';
import { addressesThunk } from '../addresses';
import { getKTUserContext } from './actions';
import type { KtState } from './index';

export interface SelfAuditRequiredState extends KtState, AddressKeysState {}

type SelfAuditThunk<Returned> = ThunkAction<
    Promise<Returned>,
    SelfAuditRequiredState,
    ProtonThunkArguments,
    UnknownAction
>;

export const loadSelfAuditResultThunk = (): SelfAuditThunk<SelfAuditResult | undefined> => {
    return async (dispatch) => {
        const ktUserContext = await dispatch(getKTUserContext());
        return loadSelfAuditResult({ ktUserContext });
    };
};

export const storeSelfAuditResultThunk = (selfAuditResult: SelfAuditResult): SelfAuditThunk<void> => {
    return async (dispatch) => {
        const ktUserContext = await dispatch(getKTUserContext());
        await storeSelfAuditResult({ ktUserContext, selfAuditResult });
    };
};

export const runSelfAuditThunk = (lastSelfAudit: SelfAuditResult | undefined): SelfAuditThunk<SelfAuditResult> => {
    return async (dispatch, _, extra) => {
        // Ensure addresses are at the latest state
        const addresses = await dispatch(addressesThunk({ cache: CacheType.None }));
        const addressesKeys = await Promise.all(
            addresses.map((address) => dispatch(addressKeysThunk({ addressID: address.ID })))
        );
        const ktUserContext = await dispatch(getKTUserContext());
        return runSelfAudit({
            ktUserContext,
            api: extra.api,
            addresses: addresses.map((address, index) => ({ address, addressKeys: addressesKeys[index] })),
            lastSelfAudit,
        });
    };
};

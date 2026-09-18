import { createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities/creator';
import { getInitialModelState } from '@proton/redux-utilities/initialModelState';
import type { ModelState } from '@proton/redux-utilities/initialModelState/interface';
import { MINUTE } from '@proton/shared/lib/constants';
import { CommonFeatureFlag } from '@proton/unleash/Flags';

import { type Campaign, CampaignEventAction, type MaybeNull } from '../interface';
import { type OffersApi, getCampaign, offersRoutes, sendCampaignEvent } from '../lib/api';
import { selectActiveCampaign as pickActiveCampaign } from '../lib/selection';

/** `cacheHelper` serves the cached campaign without a request until it's this
 * old. Not exact: the framework adds 0-5 minutes of jitter, so the effective
 * interval is 10-15 minutes. */
const CAMPAIGN_EXPIRY = 10 * MINUTE;

const TERMINAL_ACTIONS = new Set<CampaignEventAction>([CampaignEventAction.DISMISSED, CampaignEventAction.CTA_CLICKED]);

/** Fixed, not configurable. The backend resolves at most one campaign per user
 * from one endpoint, so a second slice in the same app could only ever fetch
 * the same thing twice — and a fixed key is what lets the selectors below be
 * plain functions instead of something a consumer has to be handed. */
const name = 'offersDelivery';

/** `endedCampaignKey` is the campaign a terminal event hid, read at selection
 * time so it also suppresses a revalidation already on the wire when the user
 * dismissed. Single slot, never cleared.
 *
 * `seenCampaignKeys` is the SEEN dedupe. It lives in the store rather than in a
 * component because it has to outlive any one surface: two call sites rendering
 * the same campaign, or one that unmounts and remounts, must not report a
 * second impression, and SEEN is unretractable.
 *
 * Neither is persisted; the backend is the sole source of durable state across
 * sessions. Both optional because `ActionReducerMapBuilder` is invariant in its
 * state, so a required field wouldn't be assignable to `handleAsyncModel`'s
 * `ReducerValue`. */
export type OffersDeliverySliceState = ModelState<MaybeNull<Campaign>> & {
    endedCampaignKey?: MaybeNull<string>;
    seenCampaignKeys?: string[];
};

/** Structural requirement on a consuming app's store, the same way every
 * `@proton/account` slice states its own. */
export interface OffersDeliveryState {
    offersDelivery: OffersDeliverySliceState;
}

const selectSlice = (state: OffersDeliveryState) => state.offersDelivery;

const modelThunk = createAsyncModelThunk<MaybeNull<Campaign>, OffersDeliveryState, ProtonThunkArguments>(
    `${name}/fetch`,
    {
        expiry: CAMPAIGN_EXPIRY,
        miss: ({ extraArgument }) => {
            /* Defence in depth against a caller that dispatches this directly.
             * Must reject, not resolve null: Unleash can flip live mid-session,
             * and `cacheHelper` would cache a null for the whole expiry window
             * otherwise. */
            if (!(extraArgument.unleashClient?.isEnabled(CommonFeatureFlag.CentralisedOffersDelivery) ?? false)) {
                throw new Error(`${CommonFeatureFlag.CentralisedOffersDelivery} is disabled`);
            }
            return getCampaign(extraArgument.api as OffersApi, offersRoutes);
        },
        previous: previousSelector(selectSlice),
    }
);

const initialState: OffersDeliverySliceState = {
    ...getInitialModelState<MaybeNull<Campaign>>(),
    endedCampaignKey: null,
    seenCampaignKeys: [],
};

const slice = createSlice({
    name,
    initialState,
    reducers: {
        /** Optimistically hides the campaign; both callers are terminal
         * server-side too. */
        endActiveCampaign: (state) => {
            state.endedCampaignKey = state.value?.campaignKey ?? null;
            state.value = null;
        },
        /** Idempotent, so a surface remounting or a second call site reporting
         * the same campaign is a no-op rather than a duplicate impression. */
        markActiveCampaignSeen: (state) => {
            const campaignKey = state.value?.campaignKey;
            if (campaignKey === undefined) {
                return;
            }

            const seen = state.seenCampaignKeys ?? [];
            if (!seen.includes(campaignKey)) {
                state.seenCampaignKeys = [...seen, campaignKey];
            }
        },
    },
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
    },
});

const { endActiveCampaign, markActiveCampaignSeen } = slice.actions;

/** Reports a lifecycle event. SEEN is deduped by `campaignKey`; terminal events
 * hide the campaign locally first so the UI doesn't block on the best-effort
 * request. */
export const sendCampaignEventThunk =
    (action: CampaignEventAction) =>
    async (
        dispatch: (action: unknown) => void,
        getState: () => OffersDeliveryState,
        extraArgument: ProtonThunkArguments
    ) => {
        const state = selectSlice(getState());
        const campaign = state?.value;
        if (!campaign) {
            return;
        }

        const { campaignKey, messageKey } = campaign;

        if (action === CampaignEventAction.SEEN) {
            if (state.seenCampaignKeys?.includes(campaignKey)) {
                return;
            }
            dispatch(markActiveCampaignSeen());
        }

        if (TERMINAL_ACTIONS.has(action)) {
            dispatch(endActiveCampaign());
        }

        try {
            await sendCampaignEvent(extraArgument.api as OffersApi, offersRoutes, {
                campaignKey,
                messageKey,
                action,
            });
        } catch {
            // best-effort; local state already reflects the transition
        }
    };

export const selectCampaign = (state: OffersDeliveryState): MaybeNull<Campaign> => selectSlice(state)?.value ?? null;

/* Expiry is a pure check in `lib/selection.ts`; `endedCampaignKey` is the one
 * state-dependent check, so it lives here instead. */
export const selectActiveCampaign =
    (now: number) =>
    (state: OffersDeliveryState): Campaign | undefined => {
        const sliceState = selectSlice(state);
        const campaign = pickActiveCampaign(sliceState?.value ?? null, now);

        if (campaign === undefined || campaign.campaignKey === sliceState?.endedCampaignKey) {
            return undefined;
        }

        return campaign;
    };

export const offersDeliveryReducer = { [name]: slice.reducer };
export const offersDeliveryActions = slice.actions;
export const campaignThunk = modelThunk.thunk;

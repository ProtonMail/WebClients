import { configureStore } from '@reduxjs/toolkit';

import { type Campaign, CampaignCtaType, CampaignEventAction, CampaignVariant } from '../interface';
import {
    type OffersDeliverySliceState,
    campaignThunk,
    offersDeliveryActions,
    offersDeliveryReducer,
    selectActiveCampaign,
    selectCampaign,
    sendCampaignEventThunk,
} from './slice';

const NOW_MS = 1_700_000_000_000;
const NOW_EPOCH = Math.floor(NOW_MS / 1000);

const reducer = offersDeliveryReducer.offersDelivery;

const makeCampaign = (overrides: Partial<Campaign> = {}): Campaign => ({
    campaignKey: 'campaign-a',
    messageKey: 'message-a',
    startTime: NOW_EPOCH - 100,
    endTime: NOW_EPOCH + 100,
    variant: CampaignVariant.BANNER,
    cta: { kind: 'upgrade' },
    message: { title: 't', body: 'b', ctaText: 'go', imageUrl: null },
    ...overrides,
});

type MaybeNullCampaign = Campaign | null;

const initial = reducer(undefined, { type: '@@INIT' });

const seed = (campaign: MaybeNullCampaign): { offersDelivery: OffersDeliverySliceState } => ({
    offersDelivery: { ...initial, value: campaign },
});

describe('offersDelivery reducer', () => {
    beforeEach(() => {
        jest.useFakeTimers().setSystemTime(NOW_MS);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('endActiveCampaign clears the campaign and latches its key', () => {
        const state = seed(makeCampaign()).offersDelivery;

        const ended = reducer(state, offersDeliveryActions.endActiveCampaign());

        expect(ended.value).toBeNull();
        expect(ended.endedCampaignKey).toBe('campaign-a');
    });

    it('markActiveCampaignSeen records the key once and is a no-op without a campaign', () => {
        const once = reducer(seed(makeCampaign()).offersDelivery, offersDeliveryActions.markActiveCampaignSeen());
        const twice = reducer(once, offersDeliveryActions.markActiveCampaignSeen());

        expect(twice.seenCampaignKeys).toEqual(['campaign-a']);

        expect(
            reducer(seed(null).offersDelivery, offersDeliveryActions.markActiveCampaignSeen()).seenCampaignKeys
        ).toEqual([]);
    });
});

describe('offersDelivery selectors', () => {
    it('selectActiveCampaign returns the active campaign, then nothing once ended', () => {
        const seeded = seed(makeCampaign());

        expect(selectActiveCampaign(NOW_EPOCH)(seeded)?.campaignKey).toBe('campaign-a');

        const ended = { offersDelivery: reducer(seeded.offersDelivery, offersDeliveryActions.endActiveCampaign()) };

        expect(selectActiveCampaign(NOW_EPOCH)(ended)).toBeUndefined();
    });

    it('selectCampaign returns the raw campaign value', () => {
        expect(selectCampaign(seed(makeCampaign()))?.campaignKey).toBe('campaign-a');
        expect(selectCampaign(seed(null))).toBeNull();
    });
});

describe('sendCampaignEventThunk', () => {
    beforeEach(() => {
        jest.useFakeTimers().setSystemTime(NOW_MS);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    const runThunk = async (campaign: MaybeNullCampaign, action: CampaignEventAction) => {
        let state = seed(campaign);
        const dispatched: unknown[] = [];
        const api = jest.fn().mockResolvedValue(undefined);
        const dispatch = (dispatchable: unknown) => {
            dispatched.push(dispatchable);
            if (typeof dispatchable === 'object' && dispatchable !== null && 'type' in dispatchable) {
                state = { offersDelivery: reducer(state.offersDelivery, dispatchable as any) };
            }
        };

        await sendCampaignEventThunk(action)(dispatch, () => state, { api } as any);

        return { state, api, dispatched };
    };

    it('reports a non-terminal event without hiding the campaign', async () => {
        const { state, api } = await runThunk(makeCampaign(), CampaignEventAction.SEEN);

        expect(api).toHaveBeenCalledTimes(1);
        expect(state.offersDelivery.value?.campaignKey).toBe('campaign-a');
    });

    it('hides the campaign on a terminal event', async () => {
        const { state, api } = await runThunk(makeCampaign(), CampaignEventAction.DISMISSED);

        expect(api).toHaveBeenCalledTimes(1);
        expect(state.offersDelivery.value).toBeNull();
    });

    it('sends the campaign keys and action to the event route', async () => {
        const api = jest.fn().mockResolvedValue(undefined);

        await sendCampaignEventThunk(CampaignEventAction.CTA_CLICKED)(
            () => {},
            () => seed(makeCampaign()),
            { api } as any
        );

        expect(api).toHaveBeenCalledWith({
            url: 'inapp/campaign/event',
            method: 'post',
            silence: true,
            data: {
                CampaignKey: 'campaign-a',
                MessageKey: 'message-a',
                Action: CampaignEventAction.CTA_CLICKED,
            },
        });
    });

    it('does nothing when there is no active campaign', async () => {
        const { api, dispatched } = await runThunk(null, CampaignEventAction.SEEN);

        expect(api).not.toHaveBeenCalled();
        expect(dispatched).toHaveLength(0);
    });

    /* The dedupe the provider used to hold in a ref. In the store it survives a
     * surface unmounting and remounting, which a ref did not. */
    it('reports SEEN once per campaign key, however many times it is asked', async () => {
        let state = seed(makeCampaign());
        const api = jest.fn().mockResolvedValue(undefined);
        const dispatch = (dispatchable: unknown) => {
            if (typeof dispatchable === 'object' && dispatchable !== null && 'type' in dispatchable) {
                state = { offersDelivery: reducer(state.offersDelivery, dispatchable as any) };
            }
        };
        const report = () => sendCampaignEventThunk(CampaignEventAction.SEEN)(dispatch, () => state, { api } as any);

        await report();
        await report();
        await report();

        expect(api).toHaveBeenCalledTimes(1);
        expect(state.offersDelivery.seenCampaignKeys).toEqual(['campaign-a']);
    });

    it('reports SEEN again for a different campaign key', async () => {
        let state = seed(makeCampaign());
        const api = jest.fn().mockResolvedValue(undefined);
        const dispatch = (dispatchable: unknown) => {
            if (typeof dispatchable === 'object' && dispatchable !== null && 'type' in dispatchable) {
                state = { offersDelivery: reducer(state.offersDelivery, dispatchable as any) };
            }
        };

        await sendCampaignEventThunk(CampaignEventAction.SEEN)(dispatch, () => state, { api } as any);

        state = { offersDelivery: { ...state.offersDelivery, value: makeCampaign({ campaignKey: 'campaign-b' }) } };
        await sendCampaignEventThunk(CampaignEventAction.SEEN)(dispatch, () => state, { api } as any);

        expect(api).toHaveBeenCalledTimes(2);
        expect(state.offersDelivery.seenCampaignKeys).toEqual(['campaign-a', 'campaign-b']);
    });

    /* A failed POST still counts as reported: retrying on the next mount would
     * double-count the impression the moment the request succeeds. */
    it('keeps the key deduped when the SEEN request itself fails', async () => {
        let state = seed(makeCampaign());
        const api = jest.fn().mockRejectedValue(new Error('gateway down'));
        const dispatch = (dispatchable: unknown) => {
            if (typeof dispatchable === 'object' && dispatchable !== null && 'type' in dispatchable) {
                state = { offersDelivery: reducer(state.offersDelivery, dispatchable as any) };
            }
        };
        const report = () => sendCampaignEventThunk(CampaignEventAction.SEEN)(dispatch, () => state, { api } as any);

        await expect(report()).resolves.toBeUndefined();
        await report();

        expect(api).toHaveBeenCalledTimes(1);
    });

    it('swallows a failed terminal event after having already hidden the campaign', async () => {
        let state = seed(makeCampaign());
        const api = jest.fn().mockRejectedValue(Object.assign(new Error('gateway down'), { status: 503 }));
        const dispatch = (dispatchable: unknown) => {
            if (typeof dispatchable === 'object' && dispatchable !== null && 'type' in dispatchable) {
                state = { offersDelivery: reducer(state.offersDelivery, dispatchable as any) };
            }
        };

        await expect(
            sendCampaignEventThunk(CampaignEventAction.DISMISSED)(dispatch, () => state, { api } as any)
        ).resolves.toBeUndefined();

        expect(api).toHaveBeenCalledTimes(1);
        expect(state.offersDelivery.value).toBeNull();
    });
});

const MINUTE_MS = 60 * 1000;

const rawCampaign = (campaignKey = 'campaign-a') => ({
    CampaignKey: campaignKey,
    MessageKey: 'message-a',
    Cta: { Type: CampaignCtaType.INTERNAL_GO_TO, Ref: 'GoToUpsell' },
    MessageBody: {
        Banner: { Title: 'Title', Body: 'Body', CtaText: 'Go', Images: null },
        Modal: null,
        Minimizable: null,
        Variant: CampaignVariant.BANNER,
    },
    StartTime: 0,
    EndTime: null,
});

/* A real store, not the hand-rolled harness above: the behaviour under test
 * lives in the thunk's interaction with `cacheHelper`. Every case here awaits
 * its dispatch to settle, which is what keeps the thunk's module-level promise
 * store from leaking an in-flight fetch into the next test. */
const buildRealStore = (
    isEnabled: jest.Mock,
    api: jest.Mock,
    preloadedState?: { offersDelivery: OffersDeliverySliceState }
) =>
    configureStore({
        reducer: offersDeliveryReducer,
        preloadedState,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                thunk: { extraArgument: { api, unleashClient: { isEnabled } } as any },
            }),
    });

describe('campaignThunk cold-session cache-poisoning regression', () => {
    it('rejects without poisoning the cache when the flag is off, then actually fetches once it flips on', async () => {
        const isEnabled = jest.fn().mockReturnValue(false);
        const api = jest.fn().mockResolvedValue({ Campaign: rawCampaign(), Code: 1000 });
        const store = buildRealStore(isEnabled, api);

        await expect(store.dispatch(campaignThunk() as any)).rejects.toThrow('CentralisedOffersDelivery is disabled');

        expect(api).not.toHaveBeenCalled();
        expect((store.getState() as any).offersDelivery.value).toBeUndefined();

        isEnabled.mockReturnValue(true);
        const campaign = await store.dispatch(campaignThunk() as any);

        expect(api).toHaveBeenCalledTimes(1);
        expect((campaign as unknown as Campaign)?.campaignKey).toBe('campaign-a');
        expect((store.getState() as any).offersDelivery.value?.campaignKey).toBe('campaign-a');
    });

    it('requests the gateway evaluate route', async () => {
        const api = jest.fn().mockResolvedValue({ Campaign: rawCampaign(), Code: 1000 });
        const store = buildRealStore(jest.fn().mockReturnValue(true), api);

        await store.dispatch(campaignThunk() as any);

        expect(api).toHaveBeenCalledWith({ url: 'inapp/evaluate', method: 'get', silence: true });
    });
});

describe('campaignThunk revalidation throttle', () => {
    beforeEach(() => {
        jest.useFakeTimers().setSystemTime(NOW_MS);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    const seedFetched = (fetchedAt: number) => ({
        offersDelivery: {
            value: makeCampaign({ endTime: null }),
            error: undefined,
            meta: { fetchedAt, fetchedEphemeral: true },
            endedCampaignKey: null,
        },
    });

    it('serves the cached campaign without a request inside the expiry window', async () => {
        const api = jest.fn().mockResolvedValue({ Campaign: rawCampaign('campaign-fresh'), Code: 1000 });
        const store = buildRealStore(jest.fn().mockReturnValue(true), api, seedFetched(NOW_MS));

        jest.setSystemTime(NOW_MS + 9 * MINUTE_MS);
        const campaign = await store.dispatch(campaignThunk() as any);

        expect(api).not.toHaveBeenCalled();
        expect((campaign as unknown as Campaign)?.campaignKey).toBe('campaign-a');
    });

    /* Seeded `fetchedAt` carries no jitter. A value written by `handleAsyncModel`
     * gets 0-5 minutes added by `getFetchedAt`, so the live interval is 10-15. */
    it('refetches once the cached campaign is past the expiry window', async () => {
        const api = jest.fn().mockResolvedValue({ Campaign: rawCampaign('campaign-fresh'), Code: 1000 });
        const store = buildRealStore(jest.fn().mockReturnValue(true), api, seedFetched(NOW_MS));

        jest.setSystemTime(NOW_MS + 11 * MINUTE_MS);
        const campaign = await store.dispatch(campaignThunk() as any);

        expect(api).toHaveBeenCalledTimes(1);
        expect((campaign as unknown as Campaign)?.campaignKey).toBe('campaign-fresh');
        expect((store.getState() as any).offersDelivery.value?.campaignKey).toBe('campaign-fresh');
    });
});

describe('terminal event racing an in-flight revalidation', () => {
    beforeEach(() => {
        jest.useFakeTimers().setSystemTime(NOW_MS);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    const seedEnded = (endedCampaignKey: string | null) => ({
        offersDelivery: {
            value: null,
            error: undefined,
            meta: { fetchedAt: 0, fetchedEphemeral: true },
            endedCampaignKey,
        },
    });

    /* GET stays pending so the dismissal lands inside the window; POST resolves
     * immediately. */
    const deferredFetch = () => {
        let settle: (response: unknown) => void = () => {};
        const pending = new Promise((resolve) => {
            settle = resolve;
        });
        const api = jest
            .fn()
            .mockImplementation((config: { method: string }) =>
                config.method === 'get' ? pending : Promise.resolve(undefined)
            );
        return { api, settle };
    };

    /* Past the expiry window: a genuine cache miss, so `state.value` keeps
     * showing the stale campaign until `fulfilled` overwrites it. */
    const dismissMidFlight = async (responseKey: string) => {
        const { api, settle } = deferredFetch();
        const store = buildRealStore(jest.fn().mockReturnValue(true), api, {
            offersDelivery: {
                value: makeCampaign({ endTime: null }),
                error: undefined,
                meta: { fetchedAt: NOW_MS, fetchedEphemeral: true },
                endedCampaignKey: null,
            },
        });
        const selectActive = () => selectActiveCampaign(NOW_EPOCH)(store.getState() as any);

        jest.setSystemTime(NOW_MS + 11 * MINUTE_MS);
        const inFlight = store.dispatch(campaignThunk() as any);
        const staleWhileFetching = selectActive();

        await store.dispatch(sendCampaignEventThunk(CampaignEventAction.DISMISSED) as any);
        const hidden = (store.getState() as any).offersDelivery;

        settle({ Campaign: rawCampaign(responseKey), Code: 1000 });
        await inFlight;

        return {
            staleWhileFetching,
            hidden,
            selectActive,
            state: (store.getState() as any).offersDelivery,
        };
    };

    it('does not resurface the dismissed campaign when the in-flight response carries it', async () => {
        const { staleWhileFetching, hidden, selectActive } = await dismissMidFlight('campaign-a');

        expect(staleWhileFetching?.campaignKey).toBe('campaign-a');
        expect(hidden.value).toBeNull();
        expect(hidden.endedCampaignKey).toBe('campaign-a');
        /* `value` is whatever the server last said -- suppression is a selection
         * concern, so nothing rewrites it behind `handleAsyncModel`. */
        expect(selectActive()).toBeUndefined();
    });

    it('lets the in-flight response through when it carries a different campaign', async () => {
        const { selectActive } = await dismissMidFlight('campaign-fresh');

        expect(selectActive()?.campaignKey).toBe('campaign-fresh');
    });

    /* The slot is never cleared, so it stays latched across every later refetch
     * in the session, however long past expiry -- not just the one response it
     * was set to catch. */
    it('keeps an ended key suppressed across later refetches', async () => {
        const api = jest.fn().mockResolvedValue({ Campaign: rawCampaign('campaign-a'), Code: 1000 });
        const store = buildRealStore(jest.fn().mockReturnValue(true), api, seedEnded('campaign-a'));

        await store.dispatch(campaignThunk() as any);

        expect(selectActiveCampaign(NOW_EPOCH)(store.getState() as any)).toBeUndefined();

        /* Past the expiry with room for the 0-5 minute jitter `getFetchedAt` adds. */
        jest.setSystemTime(NOW_MS + 20 * MINUTE_MS);
        await store.dispatch(campaignThunk() as any);

        expect(selectActiveCampaign(NOW_EPOCH)(store.getState() as any)).toBeUndefined();
    });

    it('surfaces a differently-keyed campaign past an ended key', async () => {
        const api = jest.fn().mockResolvedValue({ Campaign: rawCampaign('campaign-fresh'), Code: 1000 });
        const store = buildRealStore(jest.fn().mockReturnValue(true), api, seedEnded('campaign-a'));

        await store.dispatch(campaignThunk() as any);

        expect(selectActiveCampaign(NOW_EPOCH)(store.getState() as any)?.campaignKey).toBe('campaign-fresh');
    });

    it('keeps the campaign hidden when the revalidation rejects', async () => {
        const api = jest.fn().mockRejectedValue(new Error('gateway down'));
        const store = buildRealStore(jest.fn().mockReturnValue(true), api, seedEnded('campaign-a'));

        await expect(store.dispatch(campaignThunk() as any)).rejects.toThrow('gateway down');

        expect((store.getState() as any).offersDelivery.value).toBeNull();
        expect(selectActiveCampaign(NOW_EPOCH)(store.getState() as any)).toBeUndefined();
    });
});

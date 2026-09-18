import { configureStore, createAction, createListenerMiddleware } from '@reduxjs/toolkit';

import { CampaignCtaType, CampaignVariant } from '../interface';
import { startOffersDeliveryListener } from './listener';
import { offersDeliveryReducer } from './slice';

const NOW_MS = 1_700_000_000_000;
const MINUTE_MS = 60 * 1000;
const GET_CAMPAIGN_URL = 'inapp/evaluate';

/* Stands in for the host's readiness action -- `bootstrapEvent` in a real app,
 * which the app passes in so this package doesn't depend on it. */
const appReady = createAction('test app ready');

const rawCampaign = () => ({
    CampaignKey: 'campaign-1',
    MessageKey: 'message-1',
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

/* Real microtasks, since the fetch chain is promise-based even under fake timers. */
const flush = () => new Promise((resolve) => jest.requireActual('timers').setImmediate(resolve));

type UnleashUpdate = () => void;

const build = ({ isEnabled = true }: { isEnabled?: boolean } = {}) => {
    const api = jest.fn(async (config: { url: string }) =>
        config.url === GET_CAMPAIGN_URL ? { Campaign: rawCampaign(), Code: 1000 } : undefined
    );

    let enabled = isEnabled;
    const updateHandlers: UnleashUpdate[] = [];
    const unleashClient = {
        isEnabled: () => enabled,
        on: (event: string, handler: UnleashUpdate) => {
            if (event === 'update') {
                updateHandlers.push(handler);
            }
        },
    };

    const listenerMiddleware = createListenerMiddleware({
        extra: { api, unleashClient } as any,
    });
    startOffersDeliveryListener(listenerMiddleware.startListening as any, { appReady });

    const store = configureStore({
        reducer: offersDeliveryReducer,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({ thunk: { extraArgument: { api, unleashClient } as any } }).prepend(
                listenerMiddleware.middleware
            ),
    });

    const getCampaignCalls = () => api.mock.calls.filter(([config]) => config.url === GET_CAMPAIGN_URL);

    const bootstrap = async () => {
        store.dispatch(appReady());
        await flush();
    };

    const setFlag = async (next: boolean) => {
        enabled = next;
        updateHandlers.forEach((handler) => handler());
        await flush();
    };

    return { store, api, getCampaignCalls, bootstrap, setFlag };
};

const setVisibility = (state: DocumentVisibilityState) => {
    Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
};

/** A hide/show round trip: only the return to `visible` revalidates, so a
 * backgrounded tab never asks. */
const returnToTab = async () => {
    setVisibility('hidden');
    document.dispatchEvent(new Event('visibilitychange'));
    setVisibility('visible');
    document.dispatchEvent(new Event('visibilitychange'));
    await flush();
};

describe('startOffersDeliveryListener', () => {
    /* The listener never unsubscribes its `visibilitychange` handler -- in an
     * app that's correct, it lives as long as the store. Across tests it isn't:
     * a handler left behind fetches into its own store first and parks the
     * result in the thunk's module-level promise store, which the next test's
     * dispatch would then be handed instead of calling its own api. */
    let addEventListenerSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.useFakeTimers().setSystemTime(NOW_MS);
        setVisibility('visible');
        addEventListenerSpy = jest.spyOn(document, 'addEventListener');
    });

    afterEach(() => {
        addEventListenerSpy.mock.calls.forEach(([type, handler]) => {
            document.removeEventListener(type as string, handler as EventListener);
        });
        addEventListenerSpy.mockRestore();
        jest.useRealTimers();
        setVisibility('visible');
    });

    it('fetches the campaign on bootstrap, with no component mounted', async () => {
        const { store, getCampaignCalls, bootstrap } = build();

        await bootstrap();

        expect(getCampaignCalls()).toHaveLength(1);
        expect((store.getState() as any).offersDelivery.value?.campaignKey).toBe('campaign-1');
    });

    it('serves the cached campaign across tab returns instead of refetching', async () => {
        const { getCampaignCalls, bootstrap } = build();

        await bootstrap();
        expect(getCampaignCalls()).toHaveLength(1);

        /* Six returns well inside the expiry window. Every one dispatches the
         * thunk; none may reach the network. */
        for (let i = 0; i < 6; i += 1) {
            await returnToTab();
        }

        expect(getCampaignCalls()).toHaveLength(1);
    });

    it('does not revalidate when the tab goes hidden', async () => {
        const { getCampaignCalls, bootstrap } = build();

        await bootstrap();

        setVisibility('hidden');
        document.dispatchEvent(new Event('visibilitychange'));
        await flush();

        expect(getCampaignCalls()).toHaveLength(1);
    });

    it('refetches once the cached campaign is past the expiry window', async () => {
        const { getCampaignCalls, bootstrap } = build();

        await bootstrap();

        /* Past 15 minutes rather than 10: `getFetchedAt` adds up to 5 minutes of
         * jitter to `fetchedAt`, so 10 alone is not reliably expired. */
        jest.setSystemTime(NOW_MS + 16 * MINUTE_MS);
        await returnToTab();

        expect(getCampaignCalls()).toHaveLength(2);
    });

    /* The flag is checked before dispatching, so a disabled app never stamps
     * `meta.fetchedAt` with a rejection and never caches the throw. */
    it('dispatches nothing while the flag is off', async () => {
        const { store, getCampaignCalls, bootstrap } = build({ isEnabled: false });

        await bootstrap();
        await returnToTab();

        expect(getCampaignCalls()).toHaveLength(0);
        expect((store.getState() as any).offersDelivery.meta.fetchedAt).toBe(0);
        expect((store.getState() as any).offersDelivery.error).toBeUndefined();
    });

    it('fetches when the flag flips on mid-session', async () => {
        const { getCampaignCalls, bootstrap, setFlag } = build({ isEnabled: false });

        await bootstrap();
        expect(getCampaignCalls()).toHaveLength(0);

        await setFlag(true);

        expect(getCampaignCalls()).toHaveLength(1);
    });

    it('does not refetch when an unleash update leaves the flag on', async () => {
        const { getCampaignCalls, bootstrap, setFlag } = build();

        await bootstrap();
        expect(getCampaignCalls()).toHaveLength(1);

        await setFlag(true);

        expect(getCampaignCalls()).toHaveLength(1);
    });
});

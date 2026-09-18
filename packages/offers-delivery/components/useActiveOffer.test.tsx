import type { PropsWithChildren } from 'react';
import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { ProtonStoreContext } from '@proton/react-redux-store';
import { CommonFeatureFlag } from '@proton/unleash/Flags';
import { useFlag } from '@proton/unleash/useFlag';
import noop from '@proton/utils/noop';

import { CampaignCtaType, CampaignEventAction, CampaignVariant } from '../interface';
import type { RawCampaign } from '../lib/api';
import { campaignThunk, offersDeliveryReducer } from '../store/slice';
import { type ActiveOffer, type UseActiveOfferOptions, useActiveOffer } from './useActiveOffer';

jest.mock('@proton/unleash/useFlag');

const mockUseFlag = jest.mocked(useFlag);

const GET_CAMPAIGN_URL = 'inapp/evaluate';
const SEND_EVENT_URL = 'inapp/campaign/event';

/** Only the flagged variant body is populated, mirroring the real backend shape. */
const rawCampaign = (variant: CampaignVariant): RawCampaign => {
    const body = { Title: 'Title', Body: 'Body', CtaText: 'Go', Images: null };

    return {
        CampaignKey: 'campaign-1',
        MessageKey: 'message-1',
        Cta: { Type: CampaignCtaType.INTERNAL_GO_TO, Ref: 'GoToUpsell' },
        MessageBody: {
            Banner: variant === CampaignVariant.BANNER ? body : null,
            Modal: variant === CampaignVariant.MODAL ? body : null,
            Minimizable: variant === CampaignVariant.MINIMIZABLE ? body : null,
            Variant: variant,
        },
        StartTime: 0,
        EndTime: null,
    };
};

const buildStore = (raw: RawCampaign) => {
    const api = jest.fn(async (config: { url: string; data?: unknown }) => {
        if (config.url === GET_CAMPAIGN_URL) {
            return { Campaign: raw, Code: 1000 };
        }
        return undefined;
    });
    const store = configureStore({
        reducer: offersDeliveryReducer,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                thunk: { extraArgument: { api, unleashClient: { isEnabled: () => true } } as any },
            }),
    });

    return { store, api };
};

/* Fetching belongs to `startOffersDeliveryListener`, not to the hook, so these
 * tests put the campaign in the store the way bootstrap would and then render. */
const seedCampaign = async (store: ReturnType<typeof buildStore>['store']) => {
    await store.dispatch(campaignThunk() as any);
};

const seenEventCalls = (api: jest.Mock) =>
    api.mock.calls.filter(
        ([config]) => config.url === SEND_EVENT_URL && (config.data as any)?.Action === CampaignEventAction.SEEN
    );

const Wrapper = ({ store, children }: PropsWithChildren<{ store: ReturnType<typeof buildStore>['store'] }>) => (
    <Provider context={ProtonStoreContext} store={store}>
        {children}
    </Provider>
);

type ProbeProps = {
    variant: CampaignVariant | CampaignVariant[];
    options?: Partial<UseActiveOfferOptions>;
    attachRef?: boolean;
    testId?: string;
    onOffer?: (offer: ActiveOffer | null) => void;
};

const Probe = ({ variant, options, attachRef = true, testId = 'probe', onOffer }: ProbeProps) => {
    const offer = useActiveOffer(variant, { onUpgrade: noop, ...options });
    onOffer?.(offer);

    if (!offer) {
        return <div data-testid={`${testId}-none`} />;
    }

    return (
        <div ref={attachRef ? offer.seenRef : undefined} data-testid={`${testId}-offer`}>
            <button data-testid={`${testId}-report-seen`} onClick={offer.reportSeen}>
                Report seen
            </button>
        </div>
    );
};

const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

describe('useActiveOffer', () => {
    beforeEach(() => {
        mockUseFlag.mockImplementation((name) => name === CommonFeatureFlag.CentralisedOffersDelivery);
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('surfaces a BANNER campaign to useActiveOffer(BANNER) but not to useActiveOffer(MODAL)', async () => {
        const { store } = buildStore(rawCampaign(CampaignVariant.BANNER));
        await seedCampaign(store);

        render(
            <Wrapper store={store}>
                <Probe variant={CampaignVariant.BANNER} testId="banner" attachRef={false} />
                <Probe variant={CampaignVariant.MODAL} testId="modal" attachRef={false} />
            </Wrapper>
        );

        screen.getByTestId('banner-offer');
        screen.getByTestId('modal-none');
    });

    it('accepts an array of variants that includes the surfaced campaign', async () => {
        const { store } = buildStore(rawCampaign(CampaignVariant.BANNER));
        await seedCampaign(store);

        render(
            <Wrapper store={store}>
                <Probe variant={[CampaignVariant.MODAL, CampaignVariant.BANNER]} testId="either" attachRef={false} />
            </Wrapper>
        );

        screen.getByTestId('either-offer');
    });

    /* MINIMIZABLE is dropped at ingest, not admitted and then left unmatched:
     * the gateway gives that variant a body with none of the fields ingest
     * reads, so it never reaches the store at all. */
    it('drops a MINIMIZABLE campaign at ingest and emits no event', async () => {
        const { store, api } = buildStore(rawCampaign(CampaignVariant.MINIMIZABLE));
        await seedCampaign(store);

        expect((store.getState() as any).offersDelivery.value).toBeNull();

        render(
            <Wrapper store={store}>
                <Probe variant={[CampaignVariant.BANNER, CampaignVariant.MODAL]} />
            </Wrapper>
        );

        screen.getByTestId('probe-none');
        expect(seenEventCalls(api)).toHaveLength(0);
    });

    it('reports SEEN exactly once when seenRef attaches, and stays at once across re-renders', async () => {
        const { store, api } = buildStore(rawCampaign(CampaignVariant.BANNER));
        await seedCampaign(store);

        const { rerender } = render(
            <Wrapper store={store}>
                <Probe variant={CampaignVariant.BANNER} />
            </Wrapper>
        );

        await waitFor(() => expect(seenEventCalls(api)).toHaveLength(1));
        expect(seenEventCalls(api)[0][0].data).toEqual({
            CampaignKey: 'campaign-1',
            MessageKey: 'message-1',
            Action: CampaignEventAction.SEEN,
        });

        for (let i = 0; i < 3; i += 1) {
            rerender(
                <Wrapper store={store}>
                    <Probe variant={CampaignVariant.BANNER} />
                </Wrapper>
            );
        }

        expect(seenEventCalls(api)).toHaveLength(1);
    });

    it('reports SEEN once, not twice, when two call sites attach a ref for the same campaign', async () => {
        const { store, api } = buildStore(rawCampaign(CampaignVariant.BANNER));
        await seedCampaign(store);

        render(
            <Wrapper store={store}>
                <Probe variant={CampaignVariant.BANNER} testId="a" />
                <Probe variant={[CampaignVariant.BANNER, CampaignVariant.MODAL]} testId="b" />
            </Wrapper>
        );

        screen.getByTestId('a-offer');
        screen.getByTestId('b-offer');
        await tick();

        expect(seenEventCalls(api)).toHaveLength(1);
    });

    /* The dedupe lives in the store, so it outlives the surface that reported.
     * A ref in a component could not do this. */
    it('does not report SEEN again when the surface unmounts and remounts', async () => {
        const { store, api } = buildStore(rawCampaign(CampaignVariant.BANNER));
        await seedCampaign(store);

        const { unmount } = render(
            <Wrapper store={store}>
                <Probe variant={CampaignVariant.BANNER} />
            </Wrapper>
        );

        await waitFor(() => expect(seenEventCalls(api)).toHaveLength(1));
        unmount();

        render(
            <Wrapper store={store}>
                <Probe variant={CampaignVariant.BANNER} />
            </Wrapper>
        );

        await tick();
        expect(seenEventCalls(api)).toHaveLength(1);
    });

    it('does not report SEEN when the hook matches but no ref is ever attached', async () => {
        const { store, api } = buildStore(rawCampaign(CampaignVariant.BANNER));
        await seedCampaign(store);

        render(
            <Wrapper store={store}>
                <Probe variant={CampaignVariant.BANNER} attachRef={false} />
            </Wrapper>
        );

        screen.getByTestId('probe-offer');
        await tick();

        expect(seenEventCalls(api)).toHaveLength(0);
    });

    it('autoReportSeen: false makes seenRef inert, but reportSeen() still works and is idempotent', async () => {
        const { store, api } = buildStore(rawCampaign(CampaignVariant.BANNER));
        await seedCampaign(store);

        render(
            <Wrapper store={store}>
                <Probe variant={CampaignVariant.BANNER} options={{ autoReportSeen: false }} />
            </Wrapper>
        );

        screen.getByTestId('probe-offer');
        await tick();
        expect(seenEventCalls(api)).toHaveLength(0);

        fireEvent.click(screen.getByTestId('probe-report-seen'));
        await waitFor(() => expect(seenEventCalls(api)).toHaveLength(1));

        fireEvent.click(screen.getByTestId('probe-report-seen'));
        await tick();
        expect(seenEventCalls(api)).toHaveLength(1);
    });

    /* The flag gates the render too, not only the fetch: it has to hide a
     * campaign the listener already put in the store. */
    it('returns null when the flag is off, even with a campaign in the store', async () => {
        const { store } = buildStore(rawCampaign(CampaignVariant.BANNER));
        await seedCampaign(store);

        expect((store.getState() as any).offersDelivery.value?.campaignKey).toBe('campaign-1');
        mockUseFlag.mockReturnValue(false);

        render(
            <Wrapper store={store}>
                <Probe variant={CampaignVariant.BANNER} />
            </Wrapper>
        );

        screen.getByTestId('probe-none');
    });

    it('dispatches no fetch of its own', async () => {
        const { store, api } = buildStore(rawCampaign(CampaignVariant.BANNER));

        render(
            <Wrapper store={store}>
                <Probe variant={CampaignVariant.BANNER} />
            </Wrapper>
        );

        await tick();

        expect(api.mock.calls.some(([config]) => config.url === GET_CAMPAIGN_URL)).toBe(false);
        screen.getByTestId('probe-none');
    });

    it('never exposes a raw href on the public campaign for an internal cta', async () => {
        const { store } = buildStore(rawCampaign(CampaignVariant.BANNER));
        await seedCampaign(store);
        let latestOffer: ActiveOffer | null = null;

        render(
            <Wrapper store={store}>
                <Probe
                    variant={CampaignVariant.BANNER}
                    attachRef={false}
                    onOffer={(offer) => {
                        latestOffer = offer;
                    }}
                />
            </Wrapper>
        );

        expect(latestOffer).not.toBeNull();
        expect(latestOffer!.campaign.cta).toEqual({ text: 'Go', kind: 'internal' });
        expect(Object.prototype.hasOwnProperty.call(latestOffer!.campaign.cta, 'href')).toBe(false);
    });

    it('routes an upgrade cta through onUpgrade and reports CtaClicked first', async () => {
        const { store, api } = buildStore(rawCampaign(CampaignVariant.BANNER));
        await seedCampaign(store);
        const onUpgrade = jest.fn();
        let latestOffer: ActiveOffer | null = null;

        render(
            <Wrapper store={store}>
                <Probe
                    variant={CampaignVariant.BANNER}
                    attachRef={false}
                    options={{ onUpgrade }}
                    onOffer={(offer) => {
                        latestOffer = offer;
                    }}
                />
            </Wrapper>
        );

        act(() => latestOffer!.onAction());

        expect(onUpgrade).toHaveBeenCalledTimes(1);
        await waitFor(() =>
            expect(
                api.mock.calls.some(
                    ([config]) =>
                        config.url === SEND_EVENT_URL &&
                        (config.data as any)?.Action === CampaignEventAction.CTA_CLICKED
                )
            ).toBe(true)
        );
    });
});

import { render, waitFor } from '@testing-library/react';
import cloneDeep from 'lodash/cloneDeep';

import {
    mockOrganizationApi,
    mockPlansApi,
    mockSubscriptionApi,
    mockUserCache,
    subscriptionDefaultResponse,
} from '@proton/components/hooks/helpers/test';
import { PLANS } from '@proton/shared/lib/constants';
import { Audience, External } from '@proton/shared/lib/interfaces';
import { apiMock, mockCache } from '@proton/testing';

import ApiContext from '../../api/apiContext';
import { CacheProvider } from '../../cache';
import EventManagerContext from '../../eventManager/context';
import SubscriptionContainer from './SubscriptionContainer';
import SubscriptionModalProvider, {
    OpenSubscriptionModalCallback,
    useSubscriptionModal,
} from './SubscriptionModalProvider';

jest.mock('@proton/components/hooks/useModals');
jest.mock('@proton/components/components/portal/Portal');
jest.mock('@proton/components/containers/payments/subscription/SubscriptionContainer');
jest.mock('@proton/components/hooks/useFeature', () => () => ({}));

beforeEach(() => {
    mockUserCache();
    mockSubscriptionApi();
    mockOrganizationApi();
    mockPlansApi();
});

const defaultEventManager = { call: jest.fn() };

const Providers = ({ children, eventManager = defaultEventManager, api = apiMock, cache = mockCache }: any) => {
    return (
        <EventManagerContext.Provider value={eventManager}>
            <ApiContext.Provider value={api}>
                <CacheProvider cache={cache}>{children}</CacheProvider>
            </ApiContext.Provider>
        </EventManagerContext.Provider>
    );
};

it('should render', async () => {
    const { container } = render(
        <Providers>
            <SubscriptionModalProvider app="proton-account">My content</SubscriptionModalProvider>
        </Providers>
    );

    await waitFor(() => {
        expect(container).toHaveTextContent('My content');
    });
});

it('should render <SubscriptionModalDisabled> if there are legacy plans', async () => {
    const subscription = cloneDeep(subscriptionDefaultResponse);
    subscription.Subscription.Plans = [
        {
            Name: PLANS.VPNBASIC, // that's a legacy plan
        } as any,
    ];
    mockSubscriptionApi(subscription);

    let openSubscriptionModal!: OpenSubscriptionModalCallback;
    const ContextReaderComponent = () => {
        const modal = useSubscriptionModal();
        openSubscriptionModal = modal[0];

        return null;
    };

    const { container } = render(
        <Providers>
            <SubscriptionModalProvider app="proton-account">
                <ContextReaderComponent />
            </SubscriptionModalProvider>
        </Providers>
    );

    await waitFor(() => {
        expect(openSubscriptionModal).toBeDefined();
    });

    openSubscriptionModal({} as any);

    expect(container).toHaveTextContent('We’re upgrading your current plan to an improved plan');
});

it('should render <SubscriptionContainer> if there is no legacy plans', async () => {
    let openSubscriptionModal!: OpenSubscriptionModalCallback;
    const ContextReaderComponent = () => {
        const modal = useSubscriptionModal();
        openSubscriptionModal = modal[0];

        return null;
    };

    const { container } = render(
        <Providers>
            <SubscriptionModalProvider app="proton-account">
                <ContextReaderComponent />
            </SubscriptionModalProvider>
        </Providers>
    );

    await waitFor(() => {
        expect(openSubscriptionModal).toBeDefined();
    });
    openSubscriptionModal({} as any);

    expect(container).toHaveTextContent('SubscriptionContainer');
});

it('should render <SubscriptionContainer> with B2B default audience if it was selected in the callback', async () => {
    let openSubscriptionModal!: OpenSubscriptionModalCallback;
    const ContextReaderComponent = () => {
        const modal = useSubscriptionModal();
        openSubscriptionModal = modal[0];

        return null;
    };

    const { container } = render(
        <Providers>
            <SubscriptionModalProvider app="proton-account">
                <ContextReaderComponent />
            </SubscriptionModalProvider>
        </Providers>
    );

    await waitFor(() => {
        expect(openSubscriptionModal).toBeDefined();
    });

    openSubscriptionModal({ defaultAudience: Audience.B2B } as any);

    expect(SubscriptionContainer).toHaveBeenCalledWith(
        expect.objectContaining({
            defaultAudience: Audience.B2B,
        }),
        {}
    );

    expect(container).toHaveTextContent('SubscriptionContainer');
});

it('should render <SubscriptionContainer> with B2B default audience if plan is a B2B plan', async () => {
    let openSubscriptionModal!: OpenSubscriptionModalCallback;
    const ContextReaderComponent = () => {
        const modal = useSubscriptionModal();
        openSubscriptionModal = modal[0];

        return null;
    };

    const { container } = render(
        <Providers>
            <SubscriptionModalProvider app="proton-account">
                <ContextReaderComponent />
            </SubscriptionModalProvider>
        </Providers>
    );

    await waitFor(() => {
        expect(openSubscriptionModal).toBeDefined();
    });

    openSubscriptionModal({ plan: PLANS.BUNDLE_PRO } as any);

    expect(SubscriptionContainer).toHaveBeenCalledWith(
        expect.objectContaining({
            defaultAudience: Audience.B2B,
        }),
        {}
    );

    expect(container).toHaveTextContent('SubscriptionContainer');
});

it('should render <SubscriptionContainer> with B2B default audience if subscription has a B2B plan', async () => {
    const subscription = cloneDeep(subscriptionDefaultResponse);
    subscription.Subscription.Plans = [
        {
            Name: PLANS.BUNDLE_PRO,
        } as any,
    ];
    mockSubscriptionApi(subscription);

    let openSubscriptionModal!: OpenSubscriptionModalCallback;
    const ContextReaderComponent = () => {
        const modal = useSubscriptionModal();
        openSubscriptionModal = modal[0];

        return null;
    };

    const { container } = render(
        <Providers>
            <SubscriptionModalProvider app="proton-account">
                <ContextReaderComponent />
            </SubscriptionModalProvider>
        </Providers>
    );

    await waitFor(() => {
        expect(openSubscriptionModal).toBeDefined();
    });

    openSubscriptionModal({} as any);

    expect(SubscriptionContainer).toHaveBeenCalledWith(
        expect.objectContaining({
            defaultAudience: Audience.B2B,
        }),
        {}
    );

    expect(container).toHaveTextContent('SubscriptionContainer');
});

it('should render <SubscriptionContainer> with FAMILY default audience if it is selected', async () => {
    let openSubscriptionModal!: OpenSubscriptionModalCallback;
    const ContextReaderComponent = () => {
        const modal = useSubscriptionModal();
        openSubscriptionModal = modal[0];

        return null;
    };

    const { container } = render(
        <Providers>
            <SubscriptionModalProvider app="proton-account">
                <ContextReaderComponent />
            </SubscriptionModalProvider>
        </Providers>
    );

    await waitFor(() => {
        expect(openSubscriptionModal).toBeDefined();
    });

    openSubscriptionModal({ defaultAudience: Audience.FAMILY } as any);

    expect(SubscriptionContainer).toHaveBeenCalledWith(
        expect.objectContaining({
            defaultAudience: Audience.FAMILY,
        }),
        {}
    );

    expect(container).toHaveTextContent('SubscriptionContainer');
});

it('should render <InAppPurchaseModal> if subscription is managed externally', async () => {
    const subscription = cloneDeep(subscriptionDefaultResponse);
    subscription.Subscription.External = External.Android;
    mockSubscriptionApi(subscription);

    let openSubscriptionModal!: OpenSubscriptionModalCallback;
    const ContextReaderComponent = () => {
        const modal = useSubscriptionModal();
        openSubscriptionModal = modal[0];

        return null;
    };

    const { getByTestId } = render(
        <Providers>
            <SubscriptionModalProvider app="proton-account">
                <ContextReaderComponent />
            </SubscriptionModalProvider>
        </Providers>
    );

    await waitFor(() => {
        expect(openSubscriptionModal).toBeDefined();
    });
    openSubscriptionModal({} as any);

    expect(getByTestId('InAppPurchaseModal/text')).not.toBeEmptyDOMElement();
});

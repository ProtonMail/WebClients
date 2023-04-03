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
import { External } from '@proton/shared/lib/interfaces';
import { apiMock, mockCache } from '@proton/testing';

import ApiContext from '../../api/apiContext';
import { CacheProvider } from '../../cache';
import EventManagerContext from '../../eventManager/context';
import SubscriptionModalProvider, {
    OpenSubscriptionModalCallback,
    useSubscriptionModal,
} from './SubscriptionModalProvider';

jest.mock('@proton/components/hooks/useModals');
jest.mock('@proton/components/components/portal/Portal');
jest.mock('@proton/components/containers/payments/subscription/SubscriptionModal');

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

    await waitFor(() => {});

    expect(container).toHaveTextContent('My content');
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

    await waitFor(() => {});
    expect(openSubscriptionModal).toBeDefined();
    openSubscriptionModal({} as any);

    expect(container).toHaveTextContent('We’re upgrading your current plan to an improved plan');
});

it('should render <SubscriptionModal> if there is no legacy plans', async () => {
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

    await waitFor(() => {});
    expect(openSubscriptionModal).toBeDefined();
    openSubscriptionModal({} as any);

    expect(container).toHaveTextContent('SubscriptionModal');
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

    await waitFor(() => {});

    expect(openSubscriptionModal).toBeDefined();
    openSubscriptionModal({} as any);

    expect(getByTestId('InAppPurchaseModal/text')).not.toBeEmptyDOMElement();
});

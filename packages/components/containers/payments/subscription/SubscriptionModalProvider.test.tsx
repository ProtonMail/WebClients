import { act, screen, waitFor } from '@testing-library/react';
import cloneDeep from 'lodash/cloneDeep';

import { getModelState } from '@proton/account/test';
import { PLANS } from '@proton/shared/lib/constants';
import { Audience, External } from '@proton/shared/lib/interfaces';
import format from '@proton/shared/lib/subscription/format';
import { getSubscriptionState } from '@proton/testing/lib/initialReduxState';

import {
    mockOrganizationApi,
    mockPlansApi,
    mockStatusApi,
    mockSubscriptionApi,
    subscriptionDefaultResponse,
    userDefault,
} from '../../../hooks/helpers/test';
import { renderWithProviders } from '../../contacts/tests/render';
import SubscriptionContainer from './SubscriptionContainer';
import type { OpenSubscriptionModalCallback } from './SubscriptionModalProvider';
import SubscriptionModalProvider, { useSubscriptionModal } from './SubscriptionModalProvider';

jest.mock('@proton/components/hooks/useModals');
jest.mock('@proton/components/components/portal/Portal');
jest.mock('@proton/components/containers/payments/subscription/SubscriptionContainer');
jest.mock('@proton/components/hooks/useFeature', () => () => ({}));

beforeEach(() => {
    mockSubscriptionApi();
    mockOrganizationApi();
    mockPlansApi();
    mockStatusApi();
});

it('should render', async () => {
    const { container } = renderWithProviders(
        <SubscriptionModalProvider app="proton-account">My content</SubscriptionModalProvider>,
        {
            preloadedState: {
                user: getModelState(userDefault),
            },
        }
    );

    await waitFor(() => {
        expect(container).toHaveTextContent('My content');
    });
});

it('should render <SubscriptionContainer> if there is no legacy plans', async () => {
    let openSubscriptionModal!: OpenSubscriptionModalCallback;
    const ContextReaderComponent = () => {
        const modal = useSubscriptionModal();
        openSubscriptionModal = modal[0];

        return null;
    };

    renderWithProviders(
        <SubscriptionModalProvider app="proton-account">
            <ContextReaderComponent />
        </SubscriptionModalProvider>
    );

    await waitFor(() => {
        expect(openSubscriptionModal).toBeDefined();
    });
    openSubscriptionModal({} as any);

    await screen.findByText('SubscriptionContainer');
});

it('should render <SubscriptionContainer> with B2B default audience if it was selected in the callback', async () => {
    let openSubscriptionModal!: OpenSubscriptionModalCallback;
    const ContextReaderComponent = () => {
        const modal = useSubscriptionModal();
        openSubscriptionModal = modal[0];

        return null;
    };

    const { container } = renderWithProviders(
        <SubscriptionModalProvider app="proton-account">
            <ContextReaderComponent />
        </SubscriptionModalProvider>
    );

    await waitFor(() => {
        expect(openSubscriptionModal).toBeDefined();
    });

    act(() => {
        openSubscriptionModal({ defaultAudience: Audience.B2B } as any);
    });

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

    const { container } = renderWithProviders(
        <SubscriptionModalProvider app="proton-account">
            <ContextReaderComponent />
        </SubscriptionModalProvider>
    );

    await waitFor(() => {
        expect(openSubscriptionModal).toBeDefined();
    });

    act(() => {
        openSubscriptionModal({ plan: PLANS.BUNDLE_PRO } as any);
    });

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

    const { container } = renderWithProviders(
        <SubscriptionModalProvider app="proton-account">
            <ContextReaderComponent />
        </SubscriptionModalProvider>
    );

    await waitFor(() => {
        expect(openSubscriptionModal).toBeDefined();
    });

    act(() => {
        openSubscriptionModal({} as any);
    });

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

    const { container } = renderWithProviders(
        <SubscriptionModalProvider app="proton-account">
            <ContextReaderComponent />
        </SubscriptionModalProvider>
    );

    await waitFor(() => {
        expect(openSubscriptionModal).toBeDefined();
    });

    act(() => {
        openSubscriptionModal({ defaultAudience: Audience.FAMILY } as any);
    });

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

    let openSubscriptionModal!: OpenSubscriptionModalCallback;
    const ContextReaderComponent = () => {
        const modal = useSubscriptionModal();
        openSubscriptionModal = modal[0];

        return null;
    };

    renderWithProviders(
        <SubscriptionModalProvider app="proton-account">
            <ContextReaderComponent />
        </SubscriptionModalProvider>,
        {
            preloadedState: {
                subscription: getSubscriptionState(
                    format(subscription.Subscription, subscription.UpcomingSubscription)
                ),
            },
        }
    );

    await waitFor(() => {
        expect(openSubscriptionModal).toBeDefined();
    });
    openSubscriptionModal({} as any);

    expect(await screen.findByTestId('InAppPurchaseModal/text')).not.toBeEmptyDOMElement();
});

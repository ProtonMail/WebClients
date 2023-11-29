import { act, fireEvent, waitFor } from '@testing-library/react';
import cloneDeep from 'lodash/cloneDeep';

import { getModelState } from '@proton/account/test';
import { renderWithProviders } from '@proton/components/containers/contacts/tests/render';
import { useModals } from '@proton/components/hooks';
import {
    mockOrganizationApi,
    mockPlansApi,
    mockSubscriptionApi,
    mockUserVPNServersCountApi,
    subscriptionDefaultResponse,
} from '@proton/components/hooks/helpers/test';
import { External } from '@proton/shared/lib/interfaces';
import formatSubscription from '@proton/shared/lib/subscription/format';

import InAppPurchaseModal from './InAppPurchaseModal';
import UnsubscribeButton from './UnsubscribeButton';

jest.mock('@proton/components/hooks/useModals');

beforeEach(() => {
    mockUserVPNServersCountApi();
    mockSubscriptionApi();
    mockOrganizationApi();
    mockPlansApi();
});

it('should render', async () => {
    const { container } = renderWithProviders(<UnsubscribeButton>Unsubscribe</UnsubscribeButton>);

    await waitFor(() => {});

    expect(container).toHaveTextContent('Unsubscribe');
});

it('should open <InAppPurchaseModal> modal if subscription is managed by Google', async () => {
    const subscription = cloneDeep(subscriptionDefaultResponse);
    subscription.Subscription.External = External.Android;

    const { getByTestId } = renderWithProviders(<UnsubscribeButton>Unsubscribe</UnsubscribeButton>, {
        preloadedState: {
            subscription: getModelState(
                formatSubscription(subscription.Subscription, subscription.UpcomingSubscription)
            ),
        },
    });

    await waitFor(() => {});
    await act(async () => {
        fireEvent.click(getByTestId('UnsubscribeButton'));
    });

    const { createModal } = useModals();
    const mockCreateModal: jest.Mock = createModal as any;

    expect(createModal).toHaveBeenCalled();
    expect(mockCreateModal.mock.lastCall[0].type).toEqual(InAppPurchaseModal);
});

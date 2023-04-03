import { act, fireEvent, render, waitFor } from '@testing-library/react';
import cloneDeep from 'lodash/cloneDeep';

import { useModals } from '@proton/components/hooks';
import {
    mockOrganizationApi,
    mockPlansApi,
    mockSubscriptionApi,
    mockUserCache,
    mockUserVPNServersCountApi,
    subscriptionDefaultResponse,
} from '@proton/components/hooks/helpers/test';
import { External } from '@proton/shared/lib/interfaces';
import { apiMock, mockCache } from '@proton/testing';

import ApiContext from '../../api/apiContext';
import { CacheProvider } from '../../cache';
import EventManagerContext from '../../eventManager/context';
import { NotificationsProvider } from '../../notifications';
import InAppPurchaseModal from './InAppPurchaseModal';
import UnsubscribeButton from './UnsubscribeButton';

jest.mock('@proton/components/hooks/useModals');

beforeEach(() => {
    mockUserVPNServersCountApi();
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
                <NotificationsProvider>
                    <CacheProvider cache={cache}>{children}</CacheProvider>
                </NotificationsProvider>
            </ApiContext.Provider>
        </EventManagerContext.Provider>
    );
};

it('should render', async () => {
    const { container } = render(
        <Providers>
            <UnsubscribeButton>Unsubscribe</UnsubscribeButton>
        </Providers>
    );

    await waitFor(() => {});

    expect(container).toHaveTextContent('Unsubscribe');
});

it('should open <InAppPurchaseModal> modal if subscription is managed by Google', async () => {
    const subscription = cloneDeep(subscriptionDefaultResponse);
    subscription.Subscription.External = External.Android;
    mockSubscriptionApi(subscription);

    const { getByTestId } = render(
        <Providers>
            <UnsubscribeButton>Unsubscribe</UnsubscribeButton>
        </Providers>
    );

    await waitFor(() => {});
    await act(async () => {
        fireEvent.click(getByTestId('UnsubscribeButton'));
    });

    const { createModal } = useModals();
    const mockCreateModal: jest.Mock = createModal as any;

    expect(createModal).toHaveBeenCalled();
    expect(mockCreateModal.mock.lastCall[0].type).toEqual(InAppPurchaseModal);
});

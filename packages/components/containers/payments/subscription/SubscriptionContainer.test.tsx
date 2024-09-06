import { fireEvent, waitFor } from '@testing-library/react';

import { renderWithProviders } from '@proton/components/containers/contacts/tests/render';
import {
    defaultSubscriptionCache,
    mockUserVPNServersCountApi,
    organizationDefaultResponse,
    plansDefaultResponse,
} from '@proton/components/hooks/helpers/test';
import * as paymentsDataUtilsModule from '@proton/components/payments/client-extensions/data-utils';
import { createTokenV4, subscribe } from '@proton/shared/lib/api/payments';
import { PLANS } from '@proton/shared/lib/constants';
import type { Organization, Plan } from '@proton/shared/lib/interfaces';
import { Audience } from '@proton/shared/lib/interfaces';
import { FREE_PLAN } from '@proton/shared/lib/subscription/freePlans';
import { defaultVPNServersCountData as mockDefaultVPNServersCountData } from '@proton/shared/lib/vpn/serversCount';
import {
    apiMock,
    applyHOCs,
    withApi,
    withAuthentication,
    withCache,
    withConfig,
    withDeprecatedModals,
    withEventManager,
    withNotifications,
} from '@proton/testing';
import { buildUser } from '@proton/testing/builders';

import type { SubscriptionContainerProps } from './SubscriptionContainer';
import SubscriptionContainer from './SubscriptionContainer';
import { SUBSCRIPTION_STEPS } from './constants';

jest.mock('@proton/components/components/portal/Portal');
jest.mock('@proton/components/hooks/useUser', () => ({
    __esModule: true,
    default: jest.fn(() => [{}, false]),
    useUser: jest.fn(() => [{}]),
    useGetUser: jest.fn(() => () => ({})),
}));
jest.mock('@proton/components/hooks/useSubscription', () => ({
    __esModule: true,
    default: jest.fn(() => [{}, false]),
    useSubscription: jest.fn(() => [{}, false]),
    useGetSubscription: jest.fn(() => [{}, false]),
}));

jest.mock('@proton/components/hooks/useFeature', () => ({
    __esModule: true,
    default: jest.fn(() => [{}, false]),
    useFeature: jest.fn(() => [{}, false]),
}));

jest.mock('@proton/components/hooks/useCalendars', () => ({
    useCalendars: jest.fn(),
    useGetCalendars: jest.fn(() => []),
}));

jest.mock('@proton/components/hooks/useVPNServersCount', () => ({
    __esModule: true,
    default: jest.fn(() => [mockDefaultVPNServersCountData, false]),
}));

const ContextSubscriptionContainer = applyHOCs(
    withConfig(),
    withNotifications(),
    withEventManager(),
    withApi(),
    withCache(),
    withDeprecatedModals(),
    withAuthentication()
)(SubscriptionContainer);

jest.spyOn(paymentsDataUtilsModule, 'useCachedUser').mockReturnValue(buildUser());

describe('SubscriptionContainer', () => {
    let props: SubscriptionContainerProps;

    beforeEach(() => {
        jest.clearAllMocks();

        mockUserVPNServersCountApi();
    });

    beforeEach(() => {
        props = {
            app: 'proton-mail',
            defaultSelectedProductPlans: {
                [Audience.B2C]: PLANS.MAIL,
                [Audience.B2B]: PLANS.MAIL_PRO,
                [Audience.FAMILY]: PLANS.FAMILY,
            },
            metrics: {
                source: 'dashboard',
            },
            render: ({ onSubmit, title, content, footer }) => {
                return (
                    <form onSubmit={onSubmit}>
                        <div>{title}</div>
                        <div>{content}</div>
                        <div>{footer}</div>
                    </form>
                );
            },
            subscription: defaultSubscriptionCache,
            organization: organizationDefaultResponse.Organization as any as Organization,
            plans: plansDefaultResponse.Plans as any as Plan[],
            freePlan: FREE_PLAN,
            paymentsStatus: {
                CountryCode: 'US',
                VendorStates: {
                    Card: true,
                    Cash: true,
                    Bitcoin: true,
                    Apple: true,
                    Paypal: true,
                },
            },
        };
    });

    it('should render', () => {
        const { container } = renderWithProviders(<ContextSubscriptionContainer {...props} />);
        expect(container).not.toBeEmptyDOMElement();
    });

    it.skip('should not create payment token if the amount is 0', async () => {
        props.step = SUBSCRIPTION_STEPS.CHECKOUT;
        props.planIDs = { mail2022: 1 };

        const { container } = renderWithProviders(<ContextSubscriptionContainer {...props} />);

        let form: HTMLFormElement | null = null;
        await waitFor(() => {
            form = container.querySelector('form');
            expect(form).not.toBeEmptyDOMElement();
        });

        if (!form) {
            throw new Error('Form not found');
        }

        fireEvent.submit(form);

        const createTokenUrl = createTokenV4({} as any).url;
        const subscribeUrl = subscribe({} as any, '' as any, 'v4').url;

        await waitFor(() => {});
        expect(apiMock).not.toHaveBeenCalledWith(expect.objectContaining({ url: createTokenUrl }));

        await waitFor(() => {
            expect(apiMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    url: subscribeUrl,
                    data: expect.objectContaining({
                        Amount: 0,
                    }),
                })
            );
        });
    });
});

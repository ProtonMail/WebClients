import { fireEvent, render, waitFor } from '@testing-library/react';

import {
    defaultSubscriptionCache,
    mockOrganizationApi,
    mockPlansCache,
    mockSubscriptionCache,
    mockUserCache,
    mockUserVPNServersCountApi,
    organizationDefaultResponse,
    plansDefaultResponse,
} from '@proton/components/hooks/helpers/test';
import { createToken, subscribe } from '@proton/shared/lib/api/payments';
import { ADDON_NAMES, PLANS } from '@proton/shared/lib/constants';
import { Audience, Organization, Plan } from '@proton/shared/lib/interfaces';
import {
    apiMock,
    applyHOCs,
    withApi,
    withAuthentication,
    withCache,
    withConfig,
    withDeprecatedModals,
    withEventManager,
    withFeatures,
    withNotifications,
} from '@proton/testing/index';

import SubscriptionContainer, { SubscriptionContainerProps } from './SubscriptionContainer';
import { SUBSCRIPTION_STEPS } from './constants';

jest.mock('@proton/components/components/portal/Portal');

const ContextSubscriptionContainer = applyHOCs(
    withConfig(),
    withNotifications(),
    withEventManager(),
    withApi(),
    withCache(),
    withDeprecatedModals(),
    withFeatures(),
    withAuthentication()
)(SubscriptionContainer);

describe('SubscriptionContainer', () => {
    let props: SubscriptionContainerProps;

    beforeEach(() => {
        jest.clearAllMocks();

        mockUserCache();
        mockPlansCache();
        mockSubscriptionCache();

        mockUserVPNServersCountApi();
        mockOrganizationApi();
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
        };
    });

    it('should render', () => {
        const { container } = render(<ContextSubscriptionContainer {...props} />);
        expect(container).not.toBeEmptyDOMElement();
    });

    it('should redirect user without supported addons directly to checkout step', async () => {
        props.step = SUBSCRIPTION_STEPS.CUSTOMIZATION;

        const { container } = render(<ContextSubscriptionContainer {...props} />);
        await waitFor(() => {
            expect(container).toHaveTextContent('Review subscription and pay');
        });

        // that's text from one of the branches of <Payment> component
        // depending on the specific test setup, you might need to change this text in the test.
        // The key idea is to ensure that the Payment component was rendered, and no matter what's exactly inside.
        // I could mock the Payment component, but I wanted to test the whole flow.
        await waitFor(() => {
            expect(container).toHaveTextContent('The minimum payment we accept is');
        });
    });

    it('should render customization step', async () => {
        props.step = SUBSCRIPTION_STEPS.CUSTOMIZATION;
        props.planIDs = {
            [PLANS.MAIL_PRO]: 1,
        };

        const { container } = render(<ContextSubscriptionContainer {...props} />);

        await waitFor(() => {
            expect(container).toHaveTextContent('Customize your plan');
        });
    });

    it('should not proceed to the checkout step after customization if there was a check error', async () => {
        props.step = SUBSCRIPTION_STEPS.CUSTOMIZATION;
        props.planIDs = { [PLANS.MAIL_PRO]: 1, [ADDON_NAMES.MEMBER]: 329 }; // user with 330 users in the organization

        const { findByTestId, container } = render(<ContextSubscriptionContainer {...props} />);
        const continueButton = await findByTestId('continue-to-review');

        apiMock.mockClear();
        apiMock.mockRejectedValueOnce(new Error());

        fireEvent.click(continueButton);
        await waitFor(() => {});

        expect(apiMock).toHaveBeenCalledTimes(1);

        expect(container).toHaveTextContent('Customize your plan');
    });

    it.skip('should not create payment token if the amount is 0', async () => {
        props.step = SUBSCRIPTION_STEPS.CHECKOUT;
        props.planIDs = { mail2022: 1 };

        const { container } = render(<ContextSubscriptionContainer {...props} />);

        let form: HTMLFormElement | null = null;
        await waitFor(() => {
            form = container.querySelector('form');
            expect(form).not.toBeEmptyDOMElement();
        });

        if (!form) {
            throw new Error('Form not found');
        }

        fireEvent.submit(form);

        const createTokenUrl = createToken({} as any).url;
        const subscribeUrl = subscribe({} as any, '' as any).url;

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

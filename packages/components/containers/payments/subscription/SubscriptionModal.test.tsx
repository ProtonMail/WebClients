import { fireEvent, render, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';

import {
    mockOrganizationApi,
    mockPlansCache,
    mockSubscriptionCache,
    mockUserCache,
    mockUserVPNServersCountApi,
} from '@proton/components/hooks/helpers/test';
import { createToken, subscribe } from '@proton/shared/lib/api/payments';
import { ADDON_NAMES, CYCLE, PLANS } from '@proton/shared/lib/constants';
import { Audience, PlansMap, SubscriptionCheckResponse, SubscriptionModel } from '@proton/shared/lib/interfaces';
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

import SubscriptionModal, { Model, Props, useProration } from './SubscriptionModal';
import { SUBSCRIPTION_STEPS } from './constants';

describe('useProration', () => {
    let model: Model;
    let subscriptionModel: SubscriptionModel;
    let checkResult: SubscriptionCheckResponse;
    const plansMap: PlansMap = {
        mail2022: {
            ID: 'Wb4NAqmiuqoA7kCHE28y92bBFfN8jaYQCLxHRAB96yGj-bh9SxguXC48_WSU-fRUjdAr-lx95c6rFLplgXyXYA==',
            Type: 1,
            Name: PLANS.MAIL,
            Title: 'Mail Plus',
            MaxDomains: 1,
            MaxAddresses: 10,
            MaxCalendars: 25,
            MaxSpace: 16106127360,
            MaxMembers: 1,
            MaxVPN: 0,
            MaxTier: 0,
            Services: 1,
            Features: 1,
            State: 1,
            Pricing: {
                '1': 499,
                '12': 4788,
                '24': 8376,
            },
            Currency: 'CHF',
            Quantity: 1,
            Cycle: 1,
            Amount: 499,
            Offers: [],
        },
        mailpro2022: {
            ID: 'rIJcBetavQi7h5qqN9nxrRnlojgl6HF6bAVG989deNJVVVx1nn2Ic3eyCVV2Adq11ddseZuWba9H5tmvLC727Q==',
            Type: 1,
            Name: PLANS.MAIL_PRO,
            Title: 'Mail Essentials',
            MaxDomains: 3,
            MaxAddresses: 10,
            MaxCalendars: 25,
            MaxSpace: 16106127360,
            MaxMembers: 1,
            MaxVPN: 0,
            MaxTier: 0,
            Services: 1,
            Features: 1,
            State: 1,
            Pricing: {
                '1': 799,
                '12': 8388,
                '24': 15576,
            },
            Currency: 'CHF',
            Quantity: 1,
            Cycle: 1,
            Amount: 799,
            Offers: [],
        },
        bundle2022: {
            ID: 'vl-JevUsz3GJc18CC1VOs-qDKqoIWlLiUePdrzFc72-BtxBPHBDZM7ayn8CNQ59Sk4XjDbwwBVpdYrPIFtOvIw==',
            Type: 1,
            Name: PLANS.BUNDLE,
            Title: 'Proton Unlimited',
            MaxDomains: 3,
            MaxAddresses: 15,
            MaxCalendars: 25,
            MaxSpace: 536870912000,
            MaxMembers: 1,
            MaxVPN: 10,
            MaxTier: 2,
            Services: 7,
            Features: 1,
            State: 1,
            Pricing: {
                '1': 1199,
                '12': 11988,
                '24': 19176,
            },
            Currency: 'CHF',
            Quantity: 1,
            Cycle: 1,
            Amount: 1199,
            Offers: [],
        },
    };

    beforeEach(() => {
        model = {
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            planIDs: {
                [PLANS.MAIL]: 1,
            },
            currency: 'CHF',
            cycle: CYCLE.MONTHLY,
        };

        subscriptionModel = {
            ID: 'id123',
            InvoiceID: 'id456',
            Cycle: CYCLE.MONTHLY,
            PeriodStart: Math.floor(Date.now() / 1000) - 1,
            PeriodEnd: Math.floor(Date.now() / 1000 + 30 * 24 * 60 * 60),
            CreateTime: Math.floor(Date.now() / 1000) - 1,
            CouponCode: null,
            Currency: 'CHF',
            Amount: 499,
            RenewAmount: 499,
            Discount: 0,
            isManagedByMozilla: false,
            External: 0,
            Plans: [
                {
                    Amount: 499,
                    Currency: 'CHF',
                    Cycle: 1,
                    Features: 1,
                    ID: 'Wb4NAqmiuqoA7kCHE28y92bBFfN8jaYQCLxHRAB96yGj-bh9SxguXC48_WSU-fRUjdAr-lx95c6rFLplgXyXYA==',
                    MaxAddresses: 10,
                    MaxCalendars: 25,
                    MaxDomains: 1,
                    MaxMembers: 1,
                    MaxSpace: 16106127360,
                    MaxTier: 0,
                    MaxVPN: 0,
                    Name: PLANS.MAIL,
                    Quantity: 1,
                    Services: 1,
                    State: 1,
                    Title: 'Mail Plus',
                    Type: 1,
                    Pricing: null as any,
                    Offers: [],
                },
            ],
        };

        checkResult = {
            Amount: 499,
            AmountDue: 499,
            Coupon: null,
            Currency: 'CHF',
            Cycle: CYCLE.MONTHLY,
            Additions: null,
            PeriodEnd: Math.floor(Date.now() / 1000 + 30 * 24 * 60 * 60),
        };
    });

    it('should return showProration === true when checkResult is undefined', () => {
        const { result } = renderHook(() => useProration(model, subscriptionModel, plansMap));
        expect(result.current.showProration).toEqual(true);
    });

    it('should return showProration === true when user buys different plan', () => {
        model.planIDs = {
            [PLANS.MAIL_PRO]: 1,
        };

        subscriptionModel.Plans[0].Name = PLANS.MAIL;

        const { result } = renderHook(() => useProration(model, subscriptionModel, plansMap, checkResult));
        expect(result.current.showProration).toEqual(true);
    });

    it('should return showProration === true if user buys the same plan but proration is undefined', () => {
        checkResult.Proration = undefined;
        const { result } = renderHook(() => useProration(model, subscriptionModel, plansMap, checkResult));
        expect(result.current.showProration).toEqual(true);
    });

    it('should return showProration === true if Proration exists and proration !== 0', () => {
        checkResult.Proration = -450;
        const { result } = renderHook(() => useProration(model, subscriptionModel, plansMap, checkResult));
        expect(result.current.showProration).toEqual(true);
    });

    it('should return showProration === false if Proration exists and proration === 0', () => {
        checkResult.Proration = 0;
        const { result } = renderHook(() => useProration(model, subscriptionModel, plansMap, checkResult));
        expect(result.current.showProration).toEqual(false);
    });
});

jest.mock('@proton/components/components/portal/Portal');
jest.mock('../../paymentMethods/useMethods');

const ContextSubscriptionModal = applyHOCs(
    withConfig(),
    withNotifications(),
    withEventManager(),
    withApi(),
    withCache(),
    withDeprecatedModals(),
    withFeatures(),
    withAuthentication()
)(SubscriptionModal);

describe('SubscriptionModal', () => {
    let props: Props;

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
            open: true,
            onClose: jest.fn(),
            isPassPlusEnabled: true,
        };
    });

    it('should render', () => {
        const { container } = render(<ContextSubscriptionModal {...props} />);
        expect(container).not.toBeEmptyDOMElement();
    });

    it('should redirect user without supported addons directly to checkout step', async () => {
        props.step = SUBSCRIPTION_STEPS.CUSTOMIZATION;

        const { container } = render(<ContextSubscriptionModal {...props} />);
        await waitFor(() => {
            expect(container).toHaveTextContent('Review subscription and pay');

            // that's text from one of the branches of <Payment> component
            // depending on the specific test setup, you might need to change this text in the test.
            // The key idea is to ensure that the Payment component was rendered, and no matter what's exactly inside.
            // I could mock the Payment component, but I wanted to test the whole flow.
            expect(container).toHaveTextContent('The minimum payment we accept is');
        });
    });

    it('should render customization step', async () => {
        props.step = SUBSCRIPTION_STEPS.CUSTOMIZATION;
        props.planIDs = {
            [PLANS.MAIL_PRO]: 1,
        };

        const { container } = render(<ContextSubscriptionModal {...props} />);

        await waitFor(() => {
            expect(container).toHaveTextContent('Customize your plan');
        });
    });

    it('should not proceed to the checkout step after customization if there was a check error', async () => {
        props.step = SUBSCRIPTION_STEPS.CUSTOMIZATION;
        props.planIDs = { [PLANS.MAIL_PRO]: 1, [ADDON_NAMES.MEMBER]: 329 }; // user with 330 users in the organization

        const { findByTestId, container } = render(<ContextSubscriptionModal {...props} />);
        const continueButton = await findByTestId('continue-to-review');

        apiMock.mockClear();
        apiMock.mockRejectedValueOnce(new Error());

        await waitFor(() => {
            fireEvent.click(continueButton);
        });

        expect(apiMock).toHaveBeenCalledTimes(1);

        expect(container).toHaveTextContent('Customize your plan');
    });

    it('should not create payment token if the amount is 0', async () => {
        props.step = SUBSCRIPTION_STEPS.CHECKOUT;
        props.planIDs = { mail2022: 1 };

        const { container } = render(<ContextSubscriptionModal {...props} />);

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

        await waitFor(() => {
            expect(apiMock).not.toHaveBeenCalledWith(expect.objectContaining({ url: createTokenUrl }));

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

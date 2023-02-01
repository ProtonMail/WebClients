import { fireEvent, render, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';

import {
    useApi,
    useEventManager,
    useGetCalendars,
    useModals,
    useNotifications,
    useOrganization,
    usePlans,
    useSubscription,
    useUser,
    useVPNCountriesCount,
    useVPNServersCount,
} from '@proton/components/hooks';
import { ADDON_NAMES, CYCLE, PLANS } from '@proton/shared/lib/constants';
import {
    Audience,
    PlansMap,
    SubscriptionCheckResponse,
    SubscriptionModel,
    UserModel,
    VPNCountries,
    VPNServers,
} from '@proton/shared/lib/interfaces';

import Payment from '../Payment';
import PlanCustomization from './PlanCustomization';
import SubscriptionModal, { Model, Props, useProration } from './SubscriptionModal';
import { SUBSCRIPTION_STEPS } from './constants';
import SubscriptionCheckout from './modal-components/SubscriptionCheckout';

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
            MaxCalendars: 20,
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
        },
        mailpro2022: {
            ID: 'rIJcBetavQi7h5qqN9nxrRnlojgl6HF6bAVG989deNJVVVx1nn2Ic3eyCVV2Adq11ddseZuWba9H5tmvLC727Q==',
            Type: 1,
            Name: PLANS.MAIL_PRO,
            Title: 'Mail Essentials',
            MaxDomains: 3,
            MaxAddresses: 10,
            MaxCalendars: 20,
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
        },
        bundle2022: {
            ID: 'vl-JevUsz3GJc18CC1VOs-qDKqoIWlLiUePdrzFc72-BtxBPHBDZM7ayn8CNQ59Sk4XjDbwwBVpdYrPIFtOvIw==',
            Type: 1,
            Name: PLANS.BUNDLE,
            Title: 'Proton Unlimited',
            MaxDomains: 3,
            MaxAddresses: 15,
            MaxCalendars: 20,
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
                    MaxCalendars: 20,
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

jest.mock('../../../hooks/useApi');
jest.mock('../../../hooks/useUser');
jest.mock('../../../hooks/useSubscription');
jest.mock('../../../hooks/useEventManager');
jest.mock('../../../hooks/useModals');
jest.mock('../../../hooks/useNotifications');
jest.mock('../../../hooks/usePlans');
jest.mock('../../../hooks/useVPNServersCount');
jest.mock('../../../hooks/useVPNCountriesCount');
jest.mock('../../../hooks/useOrganization');
jest.mock('../../../hooks/useCalendars', () => ({
    __esModule: true,
    useGetCalendars: jest.fn(),
}));

jest.mock('./PlanCustomization');
jest.mock('../Payment');
jest.mock('./modal-components/SubscriptionCheckout');
jest.mock('../../../components/portal/Portal', () => ({ children }: any) => <>{children}</>);

describe('SubscriptionModal', () => {
    let props: Props;
    let freeUser: UserModel;
    let api: jest.Mock;

    beforeEach(() => {
        props = {
            app: 'proton-mail',
            defaultSelectedProductPlans: {
                [Audience.B2C]: PLANS.MAIL,
                [Audience.B2B]: PLANS.MAIL_PRO,
            },
            open: true,
            onClose: jest.fn(),
        };

        api = jest.fn();
        (useApi as jest.Mock).mockReturnValue(api);

        freeUser = {
            ID: 'yUts9NJMnyh5lEXZG8STllXpIz7y3TyVRR-Uhc1-Ei7rAjYR_UZBxeqcrLg62E3gLdn0VfyEl8-gjwibUtLsbQ==',
            Name: 'proton721',
            Currency: 'CHF',
            Credit: 0,
            Type: 1,
            CreateTime: 1675091808,
            MaxSpace: 524288000,
            MaxUpload: 26214400,
            UsedSpace: 248329,
            Subscribed: 0,
            Services: 1,
            MnemonicStatus: 1,
            Role: 0,
            Private: 1,
            Delinquent: 0,
            Keys: [],
            ToMigrate: 0,
            Email: 'proton721@proton.black',
            DisplayName: 'proton721',
            isAdmin: false,
            isPaid: false,
            isFree: true,
            isMember: false,
            isPrivate: true,
            isSubUser: false,
            isDelinquent: false,
            hasNonDelinquentScope: true,
            hasPaidMail: false,
            hasPaidVpn: false,
            canPay: true,
            DriveEarlyAccess: 0,
            Idle: 0,
        };
        (useUser as jest.Mock).mockReturnValue([freeUser]);

        let noSubscription: any = {}; // otherwise it should be SubscriptionModel
        (useSubscription as jest.Mock).mockReturnValue([noSubscription]);

        let call = jest.fn();
        (useEventManager as jest.Mock).mockReturnValue({ call });

        let createModal = jest.fn();
        (useModals as jest.Mock).mockReturnValue({ createModal });

        let createNotification = jest.fn();
        (useNotifications as jest.Mock).mockReturnValue({ createNotification });

        (usePlans as jest.Mock).mockReturnValue([]);

        let vpnServers: VPNServers = { free_vpn: 0, [PLANS.VPN]: 0 };
        (useVPNServersCount as jest.Mock).mockReturnValue([vpnServers]);

        let vpnCountries: VPNCountries = { free_vpn: { count: 0 }, [PLANS.VPN]: { count: 0 } };
        (useVPNCountriesCount as jest.Mock).mockReturnValue([vpnCountries]);

        let noOrganization: any = {}; // otherwise it is Organization
        (useOrganization as jest.Mock).mockReturnValue([noOrganization]);

        let getCalendars = jest.fn();
        (useGetCalendars as jest.Mock).mockReturnValue(getCalendars);
    });

    it('should render', async () => {
        let { container } = render(<SubscriptionModal {...props} />);
        expect(container).not.toBeEmptyDOMElement();
    });

    it('should redirect user without supported addons directly to checkout step', async () => {
        props.step = SUBSCRIPTION_STEPS.CUSTOMIZATION;

        // That's for initial rednering of CUSTOMIZATION step
        (PlanCustomization as jest.Mock).mockReturnValue(null);

        // These components consitute the checkout logic
        (Payment as jest.Mock).mockReturnValue(<>Payment component</>);
        (SubscriptionCheckout as jest.Mock).mockReturnValue(null);

        let { container } = render(<SubscriptionModal {...props} />);
        await waitFor(() => {
            expect(SubscriptionCheckout).toHaveBeenCalled();
            expect(Payment).toHaveBeenCalled();
            expect(container).toHaveTextContent('Payment component');
            expect(container).toHaveTextContent('Review subscription and pay');
        });
    });

    it('should render customization step', async () => {
        props.step = SUBSCRIPTION_STEPS.CUSTOMIZATION;
        props.planIDs = {
            [PLANS.MAIL_PRO]: 1,
        };

        (PlanCustomization as jest.Mock).mockReturnValue(<>Plan customization component</>);

        let { container } = render(<SubscriptionModal {...props} />);

        await waitFor(() => {
            expect(PlanCustomization).toHaveBeenCalled();
            expect(container).toHaveTextContent('Plan customization component');
            expect(container).toHaveTextContent('Customize your plan');
        });
    });

    it('should not proceed to the checkout step after customization if there was a check error', async () => {
        props.step = SUBSCRIPTION_STEPS.CUSTOMIZATION;
        props.planIDs = { [PLANS.MAIL_PRO]: 1, [ADDON_NAMES.MEMBER]: 329 }; // user with 330 users in the organization

        // this component is rendered during the customization step
        (PlanCustomization as jest.Mock).mockReturnValue(<>Plan customization component</>);

        // rendering the button from the submit property of <SubscriptionCheckout>
        (SubscriptionCheckout as jest.Mock).mockImplementation(({ submit }) => submit);

        // this component is rendered during the checkout step
        (Payment as jest.Mock).mockReturnValue(<>Payment component</>);

        let { findByTestId, container } = render(<SubscriptionModal {...props} />);
        let continueButton = await findByTestId('continue-to-review');

        api.mockReset();
        api.mockRejectedValue(new Error());

        await waitFor(() => {
            fireEvent.click(continueButton);
        });

        expect(api).toHaveBeenCalledTimes(1);

        expect(container).toHaveTextContent('Plan customization component');
    });

    // Discovered this bug
    // it('should not call form`s onSubmit when user is still on the customization step and presses Enter', () => {});
});

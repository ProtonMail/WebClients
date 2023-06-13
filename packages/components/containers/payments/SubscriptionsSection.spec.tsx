import { render } from '@testing-library/react';

import { PLANS } from '@proton/shared/lib/constants';
import { SubscriptionModel } from '@proton/shared/lib/interfaces';

import { Loader } from '../../components/loader';
import { usePlans, useSubscription } from '../../hooks';
import MozillaInfoPanel from '../account/MozillaInfoPanel';
import SubscriptionsSection from './SubscriptionsSection';

jest.mock('../../hooks');
jest.mock('../../components/loader', () => ({
    __esModule: true,
    Loader: jest.fn(() => null),
}));
jest.mock('../account/MozillaInfoPanel', () => ({
    __esModule: true,
    default: jest.fn(() => null),
}));

const mockedUsePlans = usePlans as jest.Mock<ReturnType<typeof usePlans>>;
const mockedUseSubscription = useSubscription as jest.Mock<ReturnType<typeof useSubscription>>;

describe('SubscriptionsSection', () => {
    let subscription: SubscriptionModel;
    let upcoming: any;
    let plans: any = [
        {
            ID: 'oVdQDF56OUBX2NOQ1BhY8ZWw96hw6B8r5TttqqwvJmcgTaHU30FRPn9jX3Q2l2V60Li-T8deZHwgA2VpI0ISiQ==',
            ParentMetaPlanID:
                'hUcV0_EeNwUmXA6EoyNrtO-ZTD8H8F6LvNaSjMaPxB5ecFkA7y-5kc3q38cGumJENGHjtSoUndkYFUx0_xlJeg==',
            Type: 1,
            Name: 'drive2022',
            Title: 'Drive Plus',
            MaxDomains: 0,
            MaxAddresses: 0,
            MaxCalendars: 0,
            MaxSpace: 214748364800,
            MaxMembers: 0,
            MaxVPN: 0,
            MaxTier: 0,
            Services: 2,
            Features: 0,
            State: 1,
            Pricing: {
                '1': 499,
                '12': 4788,
                '24': 8376,
            },
            PeriodEnd: {
                '1': 1671708720,
                '12': 1700652720,
                '24': 1732275120,
            },
            Currency: 'CHF',
            Quantity: 1,
            Cycle: 1,
            Amount: 499,
        },
        {
            ID: 'Wb4NAqmiuqoA7kCHE28y92bBFfN8jaYQCLxHRAB96yGj-bh9SxguXC48_WSU-fRUjdAr-lx95c6rFLplgXyXYA==',
            ParentMetaPlanID:
                'hUcV0_EeNwUmXA6EoyNrtO-ZTD8H8F6LvNaSjMaPxB5ecFkA7y-5kc3q38cGumJENGHjtSoUndkYFUx0_xlJeg==',
            Type: 1,
            Name: 'mail2022',
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
            PeriodEnd: {
                '1': 1671708720,
                '12': 1700652720,
                '24': 1732275120,
            },
            Currency: 'CHF',
            Quantity: 1,
            Cycle: 1,
            Amount: 499,
        },
        {
            ID: 'rIJcBetavQi7h5qqN9nxrRnlojgl6HF6bAVG989deNJVVVx1nn2Ic3eyCVV2Adq11ddseZuWba9H5tmvLC727Q==',
            ParentMetaPlanID:
                'hUcV0_EeNwUmXA6EoyNrtO-ZTD8H8F6LvNaSjMaPxB5ecFkA7y-5kc3q38cGumJENGHjtSoUndkYFUx0_xlJeg==',
            Type: 1,
            Name: 'mailpro2022',
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
            PeriodEnd: {
                '1': 1671708720,
                '12': 1700652720,
                '24': 1732275120,
            },
            Currency: 'CHF',
            Quantity: 1,
            Cycle: 1,
            Amount: 799,
        },
        {
            ID: 'V8YH-f59VKMEWv-eXJXf0NTtxxFUh7CcVwzdqnHNnnU38bQvhYEe7Dv8NiuyNTavhcxRmaVY1k73EyXZO0QZ_w==',
            ParentMetaPlanID:
                'hUcV0_EeNwUmXA6EoyNrtO-ZTD8H8F6LvNaSjMaPxB5ecFkA7y-5kc3q38cGumJENGHjtSoUndkYFUx0_xlJeg==',
            Type: 1,
            Name: 'vpn2022',
            Title: 'VPN Plus',
            MaxDomains: 0,
            MaxAddresses: 0,
            MaxCalendars: 0,
            MaxSpace: 0,
            MaxMembers: 0,
            MaxVPN: 10,
            MaxTier: 2,
            Services: 4,
            Features: 0,
            State: 1,
            Pricing: {
                '1': 999,
                '12': 7188,
                '15': 14985,
                '24': 11976,
                '30': 29970,
            },
            PeriodEnd: {
                '1': 1671708720,
                '12': 1700652720,
                '15': 1708601520,
                '24': 1732275120,
                '30': 1747913520,
            },
            Currency: 'CHF',
            Quantity: 1,
            Cycle: 1,
            Amount: 999,
        },
        {
            ID: 'vl-JevUsz3GJc18CC1VOs-qDKqoIWlLiUePdrzFc72-BtxBPHBDZM7ayn8CNQ59Sk4XjDbwwBVpdYrPIFtOvIw==',
            ParentMetaPlanID:
                'hUcV0_EeNwUmXA6EoyNrtO-ZTD8H8F6LvNaSjMaPxB5ecFkA7y-5kc3q38cGumJENGHjtSoUndkYFUx0_xlJeg==',
            Type: 1,
            Name: 'bundle2022',
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
            PeriodEnd: {
                '1': 1671708720,
                '12': 1700652720,
                '24': 1732275120,
            },
            Currency: 'CHF',
            Quantity: 1,
            Cycle: 1,
            Amount: 1199,
        },
        {
            ID: 'qsp04zdW5J0BpEwN3obRrGUavhoXm_MksQozisI5JiFpGm0CaRTWMY44R3YBYXEP5bH7SrQQxn6jMndFsNqWtQ==',
            ParentMetaPlanID:
                'hUcV0_EeNwUmXA6EoyNrtO-ZTD8H8F6LvNaSjMaPxB5ecFkA7y-5kc3q38cGumJENGHjtSoUndkYFUx0_xlJeg==',
            Type: 1,
            Name: 'drivepro2022',
            Title: 'Drive Essentials',
            MaxDomains: 0,
            MaxAddresses: 0,
            MaxCalendars: 0,
            MaxSpace: 1099511627776,
            MaxMembers: 1,
            MaxVPN: 0,
            MaxTier: 0,
            Services: 2,
            Features: 1,
            State: 1,
            Pricing: {
                '1': 1199,
                '12': 11988,
                '24': 19176,
            },
            PeriodEnd: {
                '1': 1671708720,
                '12': 1700652720,
                '24': 1732275120,
            },
            Currency: 'CHF',
            Quantity: 1,
            Cycle: 1,
            Amount: 1199,
        },
        {
            ID: 'sS277jpbBUgah-s2u2i1dEQvMLPMpbXvAF_rcETf7UDk1ScetcBaCWENL6gBPpNec3va8oKHUWmFPt741LFlgA==',
            ParentMetaPlanID:
                'hUcV0_EeNwUmXA6EoyNrtO-ZTD8H8F6LvNaSjMaPxB5ecFkA7y-5kc3q38cGumJENGHjtSoUndkYFUx0_xlJeg==',
            Type: 1,
            Name: 'bundlepro2022',
            Title: 'Business',
            MaxDomains: 10,
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
                '1': 1299,
                '12': 13188,
                '24': 23976,
            },
            PeriodEnd: {
                '1': 1671708720,
                '12': 1700652720,
                '24': 1732275120,
            },
            Currency: 'CHF',
            Quantity: 1,
            Cycle: 1,
            Amount: 1299,
        },
        {
            ID: 'T4e4LkfNW5sshJFZW0H_ylO5Ol_giW_BNyf-aLNgQTAMS91G7GWSWJIhd52hDkV_fvfGmL--05Q7N3PwS9cYdA==',
            ParentMetaPlanID:
                'hUcV0_EeNwUmXA6EoyNrtO-ZTD8H8F6LvNaSjMaPxB5ecFkA7y-5kc3q38cGumJENGHjtSoUndkYFUx0_xlJeg==',
            Type: 1,
            Name: 'enterprise2022',
            Title: 'Enterprise',
            MaxDomains: 10,
            MaxAddresses: 15,
            MaxCalendars: 25,
            MaxSpace: 1099511627776,
            MaxMembers: 1,
            MaxVPN: 10,
            MaxTier: 2,
            Services: 7,
            Features: 1,
            State: 1,
            Pricing: {
                '1': 1599,
                '12': 16788,
                '24': 31176,
            },
            PeriodEnd: {
                '1': 1671708720,
                '12': 1700652720,
                '24': 1732275120,
            },
            Currency: 'CHF',
            Quantity: 1,
            Cycle: 1,
            Amount: 1599,
        },
        {
            ID: 'C4cbQr9wjCLGsxQLxGrkfyQfiawdf4T2BP2fc6K0CPnGnL9LWBM5IRlKWt5YkBOukOgHCJGeVyq3M0McQuXh1w==',
            ParentMetaPlanID:
                'sS277jpbBUgah-s2u2i1dEQvMLPMpbXvAF_rcETf7UDk1ScetcBaCWENL6gBPpNec3va8oKHUWmFPt741LFlgA==',
            Type: 0,
            Name: '1domain-bundlepro2022',
            Title: '+1 Domain for Business',
            MaxDomains: 1,
            MaxAddresses: 0,
            MaxCalendars: 0,
            MaxSpace: 0,
            MaxMembers: 0,
            MaxVPN: 0,
            MaxTier: 0,
            Services: 7,
            Features: 0,
            State: 1,
            Pricing: {
                '1': 150,
                '12': 1680,
                '24': 3120,
            },
            PeriodEnd: {
                '1': 1671708720,
                '12': 1700652720,
                '24': 1732275120,
            },
            Currency: 'CHF',
            Quantity: 1,
            Cycle: 1,
            Amount: 150,
        },
        {
            ID: 'dM7tIbqARP2pnfphQaa9xDOEKHUo5Z5DCPj-dIM8g44xHRgDTg3aREOV2NzIiemcT-TZzCZH1HARpdzs_FGjLA==',
            ParentMetaPlanID:
                'rIJcBetavQi7h5qqN9nxrRnlojgl6HF6bAVG989deNJVVVx1nn2Ic3eyCVV2Adq11ddseZuWba9H5tmvLC727Q==',
            Type: 0,
            Name: '1member-mailpro2022',
            Title: '+1 User',
            MaxDomains: 0,
            MaxAddresses: 10,
            MaxCalendars: 25,
            MaxSpace: 16106127360,
            MaxMembers: 1,
            MaxVPN: 0,
            MaxTier: 0,
            Services: 1,
            Features: 0,
            State: 1,
            Pricing: {
                '1': 799,
                '12': 8388,
                '24': 15576,
            },
            PeriodEnd: {
                '1': 1671708720,
                '12': 1700652720,
                '24': 1732275120,
            },
            Currency: 'CHF',
            Quantity: 1,
            Cycle: 1,
            Amount: 799,
        },
        {
            ID: 'W9WsR1K0IWZ1RJtsy09D63IcHqhJOF_-XjFcSY6IXuMWLXYqecPZLX2nWXyCYIR6jsje6O_C3jgnSNiVrJUP1Q==',
            ParentMetaPlanID:
                'sS277jpbBUgah-s2u2i1dEQvMLPMpbXvAF_rcETf7UDk1ScetcBaCWENL6gBPpNec3va8oKHUWmFPt741LFlgA==',
            Type: 0,
            Name: '1member-bundlepro2022',
            Title: '+1 User for Business',
            MaxDomains: 0,
            MaxAddresses: 15,
            MaxCalendars: 25,
            MaxSpace: 536870912000,
            MaxMembers: 1,
            MaxVPN: 10,
            MaxTier: 0,
            Services: 7,
            Features: 0,
            State: 1,
            Pricing: {
                '1': 1299,
                '12': 13188,
                '24': 23976,
            },
            PeriodEnd: {
                '1': 1671708720,
                '12': 1700652720,
                '24': 1732275120,
            },
            Currency: 'CHF',
            Quantity: 1,
            Cycle: 1,
            Amount: 1299,
        },
        {
            ID: 'm06m9l7AM8HPQDX9imVQ0TvrGKVaDWuSt5gI0lGRLgF0WJX5a6ZzOQRVzK9MK48XW3_I1mTXWnOx10048TSYCA==',
            ParentMetaPlanID:
                'T4e4LkfNW5sshJFZW0H_ylO5Ol_giW_BNyf-aLNgQTAMS91G7GWSWJIhd52hDkV_fvfGmL--05Q7N3PwS9cYdA==',
            Type: 0,
            Name: '1domain-enterprise2022',
            Title: '+1 Domain for Enterprise',
            MaxDomains: 1,
            MaxAddresses: 0,
            MaxCalendars: 0,
            MaxSpace: 0,
            MaxMembers: 0,
            MaxVPN: 0,
            MaxTier: 0,
            Services: 7,
            Features: 0,
            State: 1,
            Pricing: {
                '1': 1599,
                '12': 16788,
                '24': 31176,
            },
            PeriodEnd: {
                '1': 1671708720,
                '12': 1700652720,
                '24': 1732275120,
            },
            Currency: 'CHF',
            Quantity: 1,
            Cycle: 1,
            Amount: 1599,
        },
        {
            ID: '5yWhEhzqCbAOSUNk6HFGKaLZ1kd4nkmS-nWqmDmndARZ62T7gWRHlxr3tukFafRfPr-weOSSgXobTuKKvfrXiQ==',
            ParentMetaPlanID:
                'T4e4LkfNW5sshJFZW0H_ylO5Ol_giW_BNyf-aLNgQTAMS91G7GWSWJIhd52hDkV_fvfGmL--05Q7N3PwS9cYdA==',
            Type: 0,
            Name: '1member-enterprise2022',
            Title: '+1 User for Enterprise',
            MaxDomains: 0,
            MaxAddresses: 15,
            MaxCalendars: 25,
            MaxSpace: 1099511627776,
            MaxMembers: 1,
            MaxVPN: 10,
            MaxTier: 0,
            Services: 7,
            Features: 0,
            State: 1,
            Pricing: {
                '1': 1599,
                '12': 16788,
                '24': 31176,
            },
            PeriodEnd: {
                '1': 1671708720,
                '12': 1700652720,
                '24': 1732275120,
            },
            Currency: 'CHF',
            Quantity: 1,
            Cycle: 1,
            Amount: 1599,
        },
        {
            ID: '-KAeU_8b61bQm7RvjDok9zAtyrIG4mZOKI9eQSWfgpASpTa9ESL9yLnjB9eC2_8fyrNCbkJFlxzrLGZPTlvwtg==',
            ParentMetaPlanID:
                'hUcV0_EeNwUmXA6EoyNrtO-ZTD8H8F6LvNaSjMaPxB5ecFkA7y-5kc3q38cGumJENGHjtSoUndkYFUx0_xlJeg==',
            Type: 1,
            Name: 'family2022',
            Title: 'Proton Family',
            MaxDomains: 5,
            MaxAddresses: 75,
            MaxCalendars: 100,
            MaxSpace: 2748779069440,
            MaxMembers: 5,
            MaxVPN: 50,
            MaxTier: 2,
            Services: 7,
            Features: 1,
            State: 0,
            Pricing: {
                '1': 2499,
                '12': 23988,
                '24': 35976,
            },
            PeriodEnd: {
                '1': 1671708720,
                '12': 1700652720,
                '24': 1732275120,
            },
            Currency: 'CHF',
            Quantity: 1,
            Cycle: 1,
            Amount: 2499,
        },
        {
            ID: 'h3CD-DT7rLoAw1vmpcajvIPAl-wwDfXR2MHtWID3wuQURDBKTiGUAwd6E2WBbS44QQKeXImW-axm6X0hAfcVCA==',
            ParentMetaPlanID:
                'hUcV0_EeNwUmXA6EoyNrtO-ZTD8H8F6LvNaSjMaPxB5ecFkA7y-5kc3q38cGumJENGHjtSoUndkYFUx0_xlJeg==',
            Type: 1,
            Name: 'visionary2022',
            Title: 'Visionary',
            MaxDomains: 10,
            MaxAddresses: 100,
            MaxCalendars: 120,
            MaxSpace: 3298534883328,
            MaxMembers: 6,
            MaxVPN: 60,
            MaxTier: 2,
            Services: 7,
            Features: 1,
            State: 0,
            Pricing: {
                '1': 2999,
                '12': 28788,
                '24': 47976,
            },
            PeriodEnd: {
                '1': 1671708720,
                '12': 1700652720,
                '24': 1732275120,
            },
            Currency: 'CHF',
            Quantity: 1,
            Cycle: 1,
            Amount: 2999,
        },
        {
            ID: 'sZyLnO5gQs05PPVIGZ0Q3bGWXKTtdZtveZgt1NYtt3Ed9i4TQ2myimEHVCyKNOKa1b1utdvyuKkaoFQbSCyA4A==',
            ParentMetaPlanID:
                'qsp04zdW5J0BpEwN3obRrGUavhoXm_MksQozisI5JiFpGm0CaRTWMY44R3YBYXEP5bH7SrQQxn6jMndFsNqWtQ==',
            Type: 0,
            Name: '1member-drivepro2022',
            Title: '+1 User',
            MaxDomains: 0,
            MaxAddresses: 0,
            MaxCalendars: 0,
            MaxSpace: 214748364800,
            MaxMembers: 1,
            MaxVPN: 0,
            MaxTier: 0,
            Services: 2,
            Features: 0,
            State: 0,
            Pricing: {
                '1': 1199,
                '12': 11988,
                '24': 19176,
            },
            PeriodEnd: {
                '1': 1671708720,
                '12': 1700652720,
                '24': 1732275120,
            },
            Currency: 'CHF',
            Quantity: 1,
            Cycle: 1,
            Amount: 1199,
        },
    ];

    beforeEach(() => {
        subscription = {
            ID: 'h3fiHve6jGce6SiAB14JJpusSHlRZT01jQWI-DK6Cc4aY8w_4qqyL8eNS021UNUJAZmT3XT5XnhQWIW97XYkpw==',
            InvoiceID: 'rUznuSfHQUAWn1-Su6KrQaptDCsOBzrINayg3j8MZ55-BrWXg5gghfiYCRWdvdobFbp5PZa-FfHC04boZv39Zg==',
            Cycle: 1,
            PeriodStart: 1669048027,
            PeriodEnd: 1671640027,
            CreateTime: 1669048027,
            CouponCode: null,
            Currency: 'CHF',
            Amount: 499,
            Discount: 0,
            RenewAmount: 499,
            Plans: [
                {
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
                    Cycle: 1,
                    Currency: 'CHF',
                    Amount: 499,
                    Quantity: 1,
                    Pricing: {
                        '1': 499,
                        '12': 4788,
                        '24': 7188,
                    },
                    DefaultPricing: {
                        '1': 499,
                        '12': 4788,
                        '24': 7188,
                    },
                    Offers: [],
                },
            ],
            isManagedByMozilla: false,
            External: null as any,
        };

        upcoming = {
            ID: 'otn4BE2IqNdCc7EBbk2RRgWcz7MM9uND1crSP6JEr77_NQFaFH4cpTd-hUPhfS6AfEqYHEJAmQTlqGVIGHhu6g==',
            InvoiceID: 'rUznuSfHQUAWn1-Su6KrQaptDCsOBzrINayg3j8MZ55-BrWXg5gghfiYCRWdvdobFbp5PZa-FfHC04boZv39Zg==',
            Cycle: 24,
            PeriodStart: 1671640027,
            PeriodEnd: 1734798427,
            CreateTime: 1669119757,
            CouponCode: 'BUNDLE',
            Currency: 'CHF',
            Amount: 499,
            Discount: 0,
            RenewDiscount: 0,
            RenewAmount: 8376,
            Plans: [
                {
                    ID: 'Wb4NAqmiuqoA7kCHE28y92bBFfN8jaYQCLxHRAB96yGj-bh9SxguXC48_WSU-fRUjdAr-lx95c6rFLplgXyXYA==',
                    ParentMetaPlanID:
                        'hUcV0_EeNwUmXA6EoyNrtO-ZTD8H8F6LvNaSjMaPxB5ecFkA7y-5kc3q38cGumJENGHjtSoUndkYFUx0_xlJeg==',
                    Type: 1,
                    Name: 'mail2022',
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
                    Cycle: 24,
                    Currency: 'CHF',
                    Amount: 8376,
                    Quantity: 1,
                },
            ],
            Renew: 1,
        };

        mockedUseSubscription.mockReturnValue([subscription, false, null as any]);

        mockedUsePlans.mockReturnValue([plans, false, null as any]);
    });

    it('should return Loader if subscription is loading', () => {
        mockedUseSubscription.mockReturnValue([subscription, true, null as any]);

        render(<SubscriptionsSection />);

        expect(Loader).toHaveBeenCalled();
    });

    it('should return Loader if plans is loading', () => {
        mockedUsePlans.mockReturnValue([plans, true, null as any]);

        render(<SubscriptionsSection />);

        expect(Loader).toHaveBeenCalled();
    });

    it('should return MozillaInfoPanel if isManagedByMozilla is true', () => {
        subscription.isManagedByMozilla = true;
        render(<SubscriptionsSection />);
        expect(MozillaInfoPanel).toHaveBeenCalled();
    });

    it('should render current subscription', () => {
        const { container } = render(<SubscriptionsSection />);

        expect(container).toHaveTextContent('Mail Plus*');
        expect(container).toHaveTextContent('4.99');
        expect(container).toHaveTextContent('Active');

        expect(container).not.toHaveTextContent('Upcoming');
    });

    it('should render current upcoming subscription', () => {
        subscription.UpcomingSubscription = upcoming;

        const { container } = render(<SubscriptionsSection />);

        expect(container).toHaveTextContent('Mail Plus');
        expect(container).toHaveTextContent('4.99');
        expect(container).toHaveTextContent('Active');

        expect(container).toHaveTextContent('Mail Plus*');
        expect(container).toHaveTextContent('83.76');
        expect(container).toHaveTextContent('Upcoming');
    });

    it('should show renewal date as end of the current subscription if there is no upcoming one', () => {
        const { container } = render(<SubscriptionsSection />);
        expect(container).toHaveTextContent('* Renews automatically on Dec 21, 2022');
    });

    it('should show renewal date as end of the upcoming subscription if there is one', () => {
        subscription.UpcomingSubscription = upcoming;
        const { container } = render(<SubscriptionsSection />);
        expect(container).toHaveTextContent('* Renews automatically on Dec 21, 2024');
    });
});

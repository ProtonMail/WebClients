import { render } from '@testing-library/react';

import { CYCLE, PLANS } from '@proton/shared/lib/constants';

import SubscriptionCycleSelector, { Props } from './SubscriptionCycleSelector';

let props: Props;

beforeEach(() => {
    props = {
        onChangeCycle: jest.fn(),
        mode: 'buttons',
        currency: 'CHF',
        cycle: CYCLE.TWO_YEARS,
        minimumCycle: CYCLE.MONTHLY,
        planIDs: {
            mail2022: 1,
        },
        plansMap: {
            mail2022: {
                ID: 'l8vWAXHBQmv0u7OVtPbcqMa4iwQaBqowINSQjPrxAr-Da8fVPKUkUcqAq30_BCxj1X0nW70HQRmAa-rIvzmKUA==',
                Type: 1,
                Name: PLANS.PLUS,
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
                DefaultPricing: {
                    '1': 499,
                    '12': 4788,
                    '24': 8376,
                },
                Currency: 'CHF',
                Quantity: 1,
                Offers: [],
                Cycle: 1,
                Amount: 499,
            },
        },
    };
});

it('should render', () => {
    const { container } = render(<SubscriptionCycleSelector {...props} />);

    expect(container).not.toBeEmptyDOMElement();
});

it('should correctly display price per month', () => {
    const { queryByTestId } = render(<SubscriptionCycleSelector {...props} />);

    expect(queryByTestId('price-per-user-per-month-1')).toHaveTextContent('CHF 4.99/month');
    expect(queryByTestId('price-per-user-per-month-12')).toHaveTextContent('CHF 3.99/month');
    expect(queryByTestId('price-per-user-per-month-24')).toHaveTextContent('CHF 3.49/month');
});

it('should correctly display price per user per month', () => {
    const planIDs = {
        mailpro2022: 1,
        '1member-mailpro2022': 3,
    };

    const plansMap = {
        mailpro2022: {
            ID: 'BKiAUbkGnUPiy2c3b0sBCK557OBnWD7ACqqX3VPoZqOOyeMdupoWcjrPDBHy3ANfFKHnJs6qdQrdvHj7zjon_g==',
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
            DefaultPricing: {
                '1': 799,
                '12': 8388,
                '24': 15576,
            },
            PeriodEnd: {
                '1': 1693576305,
                '12': 1722520305,
                '24': 1754056305,
            },
            Currency: 'CHF',
            Quantity: 1,
            Offers: [],
            Cycle: 1,
            Amount: 799,
        },
        '1member-mailpro2022': {
            ID: 'FK4MKKIVJqOC9Pg_sAxCjNWf8PM9yGzrXO3eXq8sk5RJB6HtaRBNUEcnvJBrQVPAtrDSoTNq4Du3FpqIxyMhHQ==',
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
            DefaultPricing: {
                '1': 799,
                '12': 8388,
                '24': 15576,
            },
            PeriodEnd: {
                '1': 1693576305,
                '12': 1722520305,
                '24': 1754056305,
            },
            Currency: 'CHF',
            Quantity: 1,
            Offers: [],
            Cycle: 1,
            Amount: 799,
        },
    };

    const { queryByTestId } = render(
        <SubscriptionCycleSelector {...props} plansMap={plansMap as any} planIDs={planIDs} />
    );

    expect(queryByTestId('price-per-user-per-month-1')).toHaveTextContent('CHF 7.99/user per month');
    expect(queryByTestId('price-per-user-per-month-12')).toHaveTextContent('CHF 6.99/user per month');
    expect(queryByTestId('price-per-user-per-month-24')).toHaveTextContent('CHF 6.49/user per month');
});

it('should correctly display price per user per month when there are non-user addons', () => {
    const planIDs = {
        bundlepro2022: 1,
        '1domain-bundlepro2022': 12,
        '1member-bundlepro2022': 8,
    };

    const plansMap = {
        bundlepro2022: {
            ID: 'q6fRrEIn0nyJBE_-YSIiVf80M2VZhOuUHW5In4heCyOdV_nGibV38tK76fPKm7lTHQLcDiZtEblk0t55wbuw4w==',
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
            Services: 15,
            Features: 1,
            State: 1,
            Pricing: {
                '1': 1299,
                '12': 13188,
                '24': 23976,
            },
            DefaultPricing: {
                '1': 1299,
                '12': 13188,
                '24': 23976,
            },
            PeriodEnd: {
                '1': 1693576305,
                '12': 1722520305,
                '24': 1754056305,
            },
            Currency: 'CHF',
            Quantity: 1,
            Offers: [],
            Cycle: 1,
            Amount: 1299,
        },
        '1domain-bundlepro2022': {
            ID: '39hry1jlHiPzhXRXrWjfS6t3fqA14QbYfrbF30l2PYYWOhVpyJ33nhujM4z4SHtfuQqTx6e7oSQokrqhLMD8LQ==',
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
            Services: 15,
            Features: 0,
            State: 1,
            Pricing: {
                '1': 150,
                '12': 1680,
                '24': 3120,
            },
            DefaultPricing: {
                '1': 150,
                '12': 1680,
                '24': 3120,
            },
            PeriodEnd: {
                '1': 1693576305,
                '12': 1722520305,
                '24': 1754056305,
            },
            Currency: 'CHF',
            Quantity: 1,
            Offers: [],
            Cycle: 1,
            Amount: 150,
        },
        '1member-bundlepro2022': {
            ID: '0WjWEbOmKh7F2a1Snx2FJKA7a3Fm05p-nIZ0TqiHjDDUa6oHnsyWeeVXgSuzumCmFE8_asJsom9ZzGbx-eDecw==',
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
            Services: 15,
            Features: 0,
            State: 1,
            Pricing: {
                '1': 1299,
                '12': 13188,
                '24': 23976,
            },
            DefaultPricing: {
                '1': 1299,
                '12': 13188,
                '24': 23976,
            },
            PeriodEnd: {
                '1': 1693576305,
                '12': 1722520305,
                '24': 1754056305,
            },
            Currency: 'CHF',
            Quantity: 1,
            Offers: [],
            Cycle: 1,
            Amount: 1299,
        },
    };

    props = {
        ...props,
        planIDs,
        plansMap: plansMap as any,
    };

    const { queryByTestId } = render(<SubscriptionCycleSelector {...props} />);

    expect(queryByTestId('price-per-user-per-month-1')).toHaveTextContent('CHF 12.99/user per month');
    expect(queryByTestId('price-per-user-per-month-12')).toHaveTextContent('CHF 10.99/user per month');
    expect(queryByTestId('price-per-user-per-month-24')).toHaveTextContent('CHF 9.99/user per month');
});

it('should display the prices correctly for VPN Plus', () => {
    const planIDs = {
        vpn2022: 1,
    };

    const plansMap = {
        vpn2022: {
            ID: 'pIJGEYyNFsPEb61otAc47_X8eoSeAfMSokny6dmg3jg2JrcdohiRuWSN2i1rgnkEnZmolVx4Np96IcwxJh1WNw==',
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
                '1': 1149,
                '12': 7188,
                '15': 14985,
                '24': 11976,
                '30': 29970,
            },
            DefaultPricing: {
                '1': 1149,
                '12': 7188,
                '15': 14985,
                '24': 11976,
                '30': 29970,
            },
            PeriodEnd: {
                '1': 1693583725,
                '12': 1722527725,
                '15': 1730476525,
                '24': 1754063725,
                '30': 1769961325,
            },
            Currency: 'CHF',
            Quantity: 1,
            Offers: [],
            Cycle: 1,
            Amount: 1149,
            Vendors: {
                Google: {
                    Plans: {
                        '12': 'giapaccount_vpn2022_12_renewing',
                    },
                    CustomerID: 'cus_google_CpVjQymENRYZmBtWQMDw',
                },
                Apple: {
                    Plans: {
                        '12': 'iosaccount_vpn2022_12_usd_non_renewing',
                    },
                    CustomerID: '',
                },
            },
        },
    };

    props = {
        ...props,
        planIDs,
        plansMap: plansMap as any,
    };

    const { queryByTestId } = render(<SubscriptionCycleSelector {...props} />);

    expect(queryByTestId('price-per-user-per-month-1')).toHaveTextContent('CHF 11.49/month');
    expect(queryByTestId('price-per-user-per-month-12')).toHaveTextContent('CHF 5.99/month');
    expect(queryByTestId('price-per-user-per-month-24')).toHaveTextContent('CHF 4.99/month');
});

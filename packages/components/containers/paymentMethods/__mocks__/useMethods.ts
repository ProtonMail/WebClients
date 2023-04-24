export default jest.fn(() => ({
    paymentMethods: [
        {
            ID: 'methodid1',
            Type: 'card',
            Autopay: 1,
            Order: 497,
            Details: {
                Last4: '4242',
                Brand: 'Visa',
                ExpMonth: '01',
                ExpYear: '2025',
                Name: 'Arthur Morgan',
                Country: 'US',
                ZIP: '11111',
                ThreeDSSupport: true,
            },
        },
        {
            ID: 'methodid2',
            Type: 'paypal',
            Autopay: 1,
            Order: 498,
            Details: {
                BillingAgreementID: 'Billing1',
                PayerID: 'Payer1',
                Payer: 'buyer@example.com',
            },
        },
        {
            ID: 'methodid3',
            Type: 'card',
            Autopay: 0,
            Order: 499,
            Details: {
                Last4: '3220',
                Brand: 'Visa',
                ExpMonth: '11',
                ExpYear: '2030',
                Name: 'Arthur Morgan',
                Country: 'US',
                ZIP: '1211',
                ThreeDSSupport: true,
            },
        },
    ],
    loading: false,
    options: {
        usedMethods: [
            {
                icon: 'brand-visa',
                text: 'Visa ending in 4242',
                // some plausible value
                value: 'methodid1',
                disabled: false,
                custom: true,
            },
            {
                icon: 'brand-paypal',
                text: 'PayPal - someId',
                value: 'methodid2',
                disabled: false,
                custom: true,
            },
            {
                icon: 'brand-visa',
                text: 'Visa ending in 3220',
                value: 'methodid3',
                disabled: false,
                custom: true,
            },
        ],
        methods: [
            {
                icon: 'credit-card',
                value: 'card',
                text: 'New credit/debit card',
            },
            {
                icon: 'money-bills',
                text: 'Cash',
                value: 'cash',
            },
        ],
    },
}));

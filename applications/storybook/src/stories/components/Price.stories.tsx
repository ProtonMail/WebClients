import type { Meta, StoryObj } from '@storybook/react-webpack5';

import Price from '@proton/components/components/price/Price';

const meta: Meta<typeof Price> = {
    title: 'Components/Price',
    args: {
        children: 6699,
        currency: 'EUR',
    },
    component: Price,
    parameters: {
        docs: {
            description: {
                component:
                    'Displays a formatted price with currency symbol. Supports EUR, CHF, and USD currencies, along with prefix, suffix, and various styling options.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Price>;

export const Default: Story = {};

export const AllCurrencies: Story = {
    render: () => (
        <ul>
            <li>
                <Price currency="EUR">{6699}</Price>
            </li>
            <li>
                <Price currency="CHF">{7699}</Price>
            </li>
            <li>
                <Price currency="USD">{8699}</Price>
            </li>
        </ul>
    ),
};

export const Large: Story = {
    args: {
        large: true,
        children: 9999,
        currency: 'USD',
    },
};

export const WithSuffix: Story = {
    args: {
        suffix: '/month',
        children: 4999,
        currency: 'EUR',
    },
};

export const WithPrefix: Story = {
    args: {
        prefix: 'from ',
        children: 1199,
        currency: 'USD',
    },
};

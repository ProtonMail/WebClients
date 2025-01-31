import { render } from '@testing-library/react';

import { CYCLE, PLANS } from '@proton/payments';
import { PLANS_MAP } from '@proton/testing/data';

import type { Props } from './SubscriptionCycleSelector';
import SubscriptionCycleSelector from './SubscriptionCycleSelector';

let props: Props;

beforeEach(() => {
    props = {
        onChangeCycle: jest.fn(),
        mode: 'buttons',
        currency: 'CHF',
        cycle: CYCLE.TWO_YEARS,
        planIDs: {
            [PLANS.MAIL]: 1,
        },
        plansMap: PLANS_MAP,
        additionalCheckResults: [],
        allowedCycles: [CYCLE.MONTHLY, CYCLE.YEARLY, CYCLE.TWO_YEARS],
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

    const { queryByTestId } = render(<SubscriptionCycleSelector {...props} plansMap={PLANS_MAP} planIDs={planIDs} />);

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

    props = {
        ...props,
        planIDs,
        plansMap: PLANS_MAP,
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

    props = {
        ...props,
        planIDs,
        plansMap: PLANS_MAP,
    };

    const { queryByTestId } = render(<SubscriptionCycleSelector {...props} />);

    expect(queryByTestId('price-per-user-per-month-1')).toHaveTextContent('CHF 9.99/month');
    expect(queryByTestId('price-per-user-per-month-12')).toHaveTextContent('CHF 5.99/month');
    expect(queryByTestId('price-per-user-per-month-24')).toHaveTextContent('CHF 4.99/month');
});

import { render } from '@testing-library/react';

import { CYCLE, PLANS } from '@proton/shared/lib/constants';
import type { Plan, PlansMap } from '@proton/shared/lib/interfaces';

import type { PlanCard } from './PlanCardSelector';
import { PlanCardSelector } from './PlanCardSelector';

const onSelect = jest.fn();

beforeEach(() => {
    jest.clearAllMocks();
});

const passPlan: Plan = {
    ID: 'id-123',
    ParentMetaPlanID: '123',
    Type: 1,
    Name: PLANS.PASS,
    Title: 'Pass Plus',
    MaxDomains: 0,
    MaxAddresses: 0,
    MaxCalendars: 0,
    MaxSpace: 0,
    MaxMembers: 0,
    MaxVPN: 0,
    MaxTier: 0,
    Services: 8,
    Features: 0,
    State: 1,
    Pricing: {
        '1': 499,
        '12': 4788,
        '24': 7176,
    },
    PeriodEnd: {
        '1': 1678452604,
        '12': 1707569404,
        '24': 1739191804,
    },
    Currency: 'CHF',
    Quantity: 1,
    Offers: [],
    Cycle: 1,
    Amount: 499,
};

const defaultPlansMap: PlansMap = {
    [PLANS.PASS]: passPlan,
};

const defaultPlanCards: PlanCard[] = [
    {
        plan: PLANS.PASS,
        subsection: null,
        type: 'best',
        guarantee: true,
    },
];

it('should render', () => {
    const { container } = render(
        <PlanCardSelector
            subscriptionDataCycleMapping={{}}
            cycle={CYCLE.MONTHLY}
            currency="CHF"
            selectedPlanName={PLANS.PASS}
            onSelect={onSelect}
            plansMap={defaultPlansMap}
            planCards={defaultPlanCards}
        />
    );

    expect(container).toBeInTheDocument();
});

it('should display the discount price comparing against the monthly price', () => {
    const { container } = render(
        <PlanCardSelector
            subscriptionDataCycleMapping={{}}
            cycle={CYCLE.YEARLY}
            currency="CHF"
            selectedPlanName={PLANS.PASS}
            onSelect={onSelect}
            plansMap={defaultPlansMap}
            planCards={defaultPlanCards}
        />
    );

    expect(container).toHaveTextContent('CHF 3.99');
    expect(container.querySelector('.text-strike')).toHaveTextContent('CHF 4.99');
    expect(container).toHaveTextContent('− 20%');
});

it('should display the discount price against the same cycle if it is discounted', () => {
    const plansMap: PlansMap = {
        ...defaultPlansMap,
        [PLANS.PASS]: {
            ...passPlan,
            Pricing: {
                '1': 499,
                '12': 1200,
                '24': 7176,
            },
        } as any,
    };

    const { container } = render(
        <PlanCardSelector
            subscriptionDataCycleMapping={{}}
            cycle={CYCLE.YEARLY}
            currency="CHF"
            selectedPlanName={PLANS.PASS}
            onSelect={onSelect}
            plansMap={plansMap}
            planCards={defaultPlanCards}
        />
    );

    expect(container).toHaveTextContent('CHF 1');
    expect(container.querySelector('.text-strike')).toHaveTextContent('CHF 4.99');
    expect(container).toHaveTextContent('− 80%');
});

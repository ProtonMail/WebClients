import { render, screen } from '@testing-library/react';

import { PLANS } from '@proton/payments/core/constants';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';

import { PlanIcon } from './PlanIcon';

vi.mock('./CustomLogo', () => ({
    default: ({ planName }: { planName?: PLANS }) => <img alt="" data-testid="plan-logo" data-plan-name={planName} />,
}));

const buildSubscriptionWithPlanName = (planName: PLANS) => {
    const lumoPlusSubscription = buildSubscription(PLANS.LUMO);
    return {
        ...lumoPlusSubscription,
        Plans: lumoPlusSubscription.Plans.map((plan) => ({ ...plan, Name: planName })),
    };
};

describe('PlanIcon', () => {
    it.each([PLANS.LUMO_BASIC, PLANS.LUMO, PLANS.LUMO_ULTRA])(
        'shows the Lumo logo for a %s subscription',
        (planName) => {
            render(<PlanIcon subscription={buildSubscriptionWithPlanName(planName)} />);

            expect(screen.getByTestId('plan-logo')).toHaveAttribute('data-plan-name', PLANS.LUMO);
        }
    );

    it.each([PLANS.LUMO_BASIC, PLANS.LUMO, PLANS.LUMO_ULTRA])(
        'shows the Lumo logo for the %s plan name',
        (planName) => {
            render(<PlanIcon planName={planName} />);

            expect(screen.getByTestId('plan-logo')).toHaveAttribute('data-plan-name', PLANS.LUMO);
        }
    );

    it('shows the Lumo Business logo for a Lumo Business subscription', () => {
        render(<PlanIcon subscription={buildSubscription(PLANS.LUMO_BUSINESS)} />);

        expect(screen.getByTestId('plan-logo')).toHaveAttribute('data-plan-name', PLANS.LUMO_BUSINESS);
    });
});

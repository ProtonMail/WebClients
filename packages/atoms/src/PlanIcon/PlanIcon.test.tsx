import { render } from '@testing-library/react';

import { PLANS, PLAN_NAMES } from '@proton/payments';
import { APPS } from '@proton/shared/lib/constants';

import PlanIcon from './PlanIcon';

describe('<PlanIcon />', () => {
    it('renders the correct icon for a given plan', () => {
        const { container } = render(<PlanIcon planName={PLANS.MAIL} app={APPS.PROTONMAIL} />);
        // Should render an img inside a div with class PlanIcon
        const iconDiv = container.querySelector('.PlanIcon');
        expect(iconDiv).toBeInTheDocument();
        const img = iconDiv?.querySelector('img');
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('alt', PLAN_NAMES[PLANS.MAIL]);
    });

    it('renders the correct icon for the free plan with app', () => {
        const { container } = render(<PlanIcon planName={PLANS.FREE} app={APPS.PROTONMAIL} />);
        const iconDiv = container.querySelector('.PlanIcon');
        expect(iconDiv).toBeInTheDocument();
        const img = iconDiv?.querySelector('img');
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('alt', PLAN_NAMES[PLANS.FREE]);
    });
});

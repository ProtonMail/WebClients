import { render, screen } from '@testing-library/react';

import { PLANS } from '@proton/payments/core/constants';
import { sizeUnits } from '@proton/shared/lib/helpers/size';
import type { Plan } from '@proton/shared/lib/payments/plan/interface';

import VisionaryUpsellModal from './VisionaryUpsellModal';

const visionaryPlan: Plan = {
    ID: 'visionary-id',
    ParentMetaPlanID: '',
    Type: 1,
    Name: PLANS.VISIONARY,
    Title: 'Visionary',
    MaxDomains: 10,
    MaxAddresses: 100,
    MaxCalendars: 150,
    MaxSpace: 6 * sizeUnits.TB,
    MaxMembers: 6,
    MaxVPN: 60,
    MaxTier: 2,
    Services: 31,
    Features: 1,
    State: 1,
    Pricing: { '1': 3999, '12': 35988, '24': 67176 },
    PeriodEnd: { '1': 1748170100, '12': 1777114100, '24': 1808650100 },
    Currency: 'CHF',
    Quantity: 1,
    Offers: [],
    Cycle: 1,
    Amount: 3999,
};

const renderModal = (plan: Plan) =>
    render(
        <VisionaryUpsellModal open plan={plan} appName="Proton Mail" onUpgrade={jest.fn()} onContinue={jest.fn()} />
    );

describe('VisionaryUpsellModal', () => {
    it('shows the storage and users of the plan', () => {
        renderModal(visionaryPlan);

        expect(screen.getByText('6 TB storage')).toBeInTheDocument();
        expect(screen.getByText('Up to 6 users')).toBeInTheDocument();
        expect(screen.getByText('The Visionary plan is back for a limited time only')).toBeInTheDocument();
    });

    it('follows a storage increase in the plan data', () => {
        renderModal({ ...visionaryPlan, MaxSpace: 8 * sizeUnits.TB });

        expect(screen.getByText('8 TB storage')).toBeInTheDocument();
        expect(screen.queryByText(/6 TB/)).not.toBeInTheDocument();
    });
});

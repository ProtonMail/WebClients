import { fireEvent, render, screen, within } from '@testing-library/react';

import { CYCLE, PLANS } from '@proton/payments/core/constants';

import { PlanTiersModal } from './PlanTiersModal';
import type { BillingCycle } from './utils';

vi.mock('../../../hooks/useIsLumoSmallScreen', () => ({
    useIsLumoSmallScreen: () => ({ isSmallScreen: false }),
}));

it('renders Payments cycles and prices in the shared dialog', () => {
    const onClose = vi.fn();
    const onCycleChange = vi.fn();

    const modal = (cycle: BillingCycle) => (
        <PlanTiersModal
            modalProps={{ open: true, onClose, onExit: vi.fn() }}
            cards={[
                { variant: 'current', price: { amount: 0, currency: 'USD', cycle } },
                {
                    tier: PLANS.LUMO,
                    variant: 'recommended',
                    selectable: true,
                    yearlySavings: 20,
                    price: { amount: cycle === CYCLE.YEARLY ? 23988 : 2499, currency: 'USD', cycle },
                },
            ]}
            cycle={cycle}
            onCycleChange={onCycleChange}
        />
    );
    const { rerender } = render(modal(CYCLE.MONTHLY));

    const dialog = within(screen.getByRole('dialog', { name: 'Choose your plan' }));
    expect(dialog.getByRole('tab', { name: 'Monthly' })).toHaveAttribute('aria-selected', 'true');

    fireEvent.click(dialog.getByRole('tab', { name: /Yearly.*Save 20%/ }));
    expect(onCycleChange).toHaveBeenCalledExactlyOnceWith(CYCLE.YEARLY);

    rerender(modal(CYCLE.YEARLY));
    expect(dialog.getByText('$239.88 billed yearly')).toBeInTheDocument();

    fireEvent.click(dialog.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledOnce();
});

it('only uses the current plan action label on the active plan', () => {
    const price = { amount: 0, currency: 'USD', cycle: CYCLE.MONTHLY } as const;

    render(
        <PlanTiersModal
            modalProps={{ open: true, onClose: vi.fn(), onExit: vi.fn() }}
            cards={[
                { tier: PLANS.LUMO_BASIC, variant: 'current', price },
                { variant: 'default', price },
                { tier: PLANS.LUMO, variant: 'recommended', price, action: { label: 'Get Lumo Plus' } },
            ]}
            cycle={CYCLE.MONTHLY}
            onCycleChange={vi.fn()}
        />
    );

    const dialog = within(screen.getByRole('dialog', { name: 'Choose your plan' }));
    expect(dialog.getByRole('button', { name: 'Current plan' })).toBeDisabled();
    expect(dialog.getByRole('button', { name: 'Get Lumo Plus' })).toBeDisabled();
    expect(within(dialog.getByRole('heading', { name: 'Free' }).closest('section')!).queryByRole('button')).toBeNull();
});

import { render, screen } from '@testing-library/react';

import { PLANS } from '@proton/payments/core/constants';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';

import { NoPaymentRequiredNote } from './NoPaymentRequiredNote';

describe('NoPaymentRequiredNote', () => {
    it('says no payment is required at this time', () => {
        render(<NoPaymentRequiredNote subscription={undefined} hasPaymentMethod={false} taxFields={null} />);

        expect(screen.getByText('No payment is required at this time.')).toBeInTheDocument();
    });

    it('drops "at this time" for Pass basic', () => {
        render(
            <NoPaymentRequiredNote subscription={undefined} hasPaymentMethod={false} taxFields={null} isPassBasic />
        );

        expect(screen.getByText('No payment is required.')).toBeInTheDocument();
    });

    it.each([true, false])(
        'shows the Pass basic copy instead of the trial copy (saved method: %s)',
        (hasPaymentMethod) => {
            render(
                <NoPaymentRequiredNote
                    subscription={buildSubscription(PLANS.PASS_BUSINESS, { IsTrial: true })}
                    hasPaymentMethod={hasPaymentMethod}
                    taxFields={null}
                    isPassBasic
                />
            );

            expect(screen.getByText('No payment is required.')).toBeInTheDocument();
            expect(screen.queryByText(/You have a trial/)).not.toBeInTheDocument();
        }
    );
});

import { render, screen } from '@testing-library/react';

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
});

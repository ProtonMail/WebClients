import { screen } from '@testing-library/react';

import { getModelState } from '@proton/account/test';
import { UNPAID_STATE } from '@proton/shared/lib/interfaces';
import type { UserModel } from '@proton/shared/lib/interfaces';
import { renderWithProviders } from '@proton/testing';

import UnpaidInvoiceTopBanner from './UnpaidInvoiceTopBanner';

describe('UnpaidInvoiceTopBanner', () => {
    it('should render', () => {
        const { container } = renderWithProviders(<UnpaidInvoiceTopBanner />);
        expect(container).toBeEmptyDOMElement();
    });

    it.each([UNPAID_STATE.AVAILABLE, UNPAID_STATE.OVERDUE])(
        'should display message when user has non-zero delinquent state - state %s',
        (Delinquent) => {
            renderWithProviders(<UnpaidInvoiceTopBanner />, {
                preloadedState: {
                    user: getModelState({ Delinquent, canPay: true } as UserModel),
                },
            });

            expect(screen.getByTestId('restricted-state')).toHaveTextContent(
                'Your account has at least one overdue invoice. Your access will soon get restricted. Pay invoice'
            );
        }
    );

    it.each([UNPAID_STATE.NOT_UNPAID, UNPAID_STATE.AVAILABLE, UNPAID_STATE.OVERDUE])(
        'should not display anything to non-paying members - %s',
        (Delinquent) => {
            const { container } = renderWithProviders(<UnpaidInvoiceTopBanner />, {
                preloadedState: {
                    user: getModelState({ Delinquent, canPay: false, isMember: true } as UserModel),
                },
            });

            expect(container).toBeEmptyDOMElement();
        }
    );
});

import { screen } from '@testing-library/react';

import { getModelState } from '@proton/account/test';
import { UNPAID_STATE } from '@proton/shared/lib/constants';
import type { UserModel } from '@proton/shared/lib/interfaces';

import { renderWithProviders } from '../contacts/tests/render';
import DelinquentTopBanner from './DelinquentTopBanner';

describe('DelinquentTopBanner', () => {
    it('should render', () => {
        const { container } = renderWithProviders(<DelinquentTopBanner />);
        expect(container).toBeEmptyDOMElement();
    });

    it.each([UNPAID_STATE.AVAILABLE, UNPAID_STATE.OVERDUE])(
        'should display message when user has non-zero delinquent state - state %s',
        (Delinquent) => {
            renderWithProviders(<DelinquentTopBanner />, {
                preloadedState: {
                    user: getModelState({ Delinquent, canPay: true } as UserModel),
                },
            });

            expect(screen.getByTestId('restricted-state')).toHaveTextContent(
                'Your account has at least one overdue invoice. Your access will soon get restricted. Pay invoice'
            );
        }
    );

    it('should render restricted state when user has DELINQUENT state', () => {
        renderWithProviders(<DelinquentTopBanner />, {
            preloadedState: {
                user: getModelState({ Delinquent: UNPAID_STATE.DELINQUENT, canPay: true } as UserModel),
            },
        });

        expect(screen.getByTestId('unpaid-state')).toHaveTextContent(
            'Your account has at least one overdue invoice. Your account is restricted. Continued non-payment will block your emails and sharing links. Pay invoice'
        );
    });

    it('should render pay invoice alert when user has NO_RECEIVE state', () => {
        renderWithProviders(<DelinquentTopBanner />, {
            preloadedState: {
                user: getModelState({ Delinquent: UNPAID_STATE.NO_RECEIVE, canPay: true } as UserModel),
            },
        });

        expect(screen.getByTestId('pay-invoice-alert')).toHaveTextContent(
            'Your account has at least one overdue invoice. Your account is restricted, and all services are now blocked until payment. Pay invoice'
        );
    });

    it.each([UNPAID_STATE.NOT_UNPAID, UNPAID_STATE.AVAILABLE, UNPAID_STATE.OVERDUE])(
        'should not display anything to non-paying members - %s',
        (Delinquent) => {
            const { container } = renderWithProviders(<DelinquentTopBanner />, {
                preloadedState: {
                    user: getModelState({ Delinquent, canPay: false, isMember: true } as UserModel),
                },
            });

            expect(container).toBeEmptyDOMElement();
        }
    );

    it.each([UNPAID_STATE.DELINQUENT, UNPAID_STATE.NO_RECEIVE])(
        'should render restricted message for members when user has %s state',
        (Delinquent) => {
            renderWithProviders(<DelinquentTopBanner />, {
                preloadedState: {
                    user: getModelState({ Delinquent, canPay: false, isMember: true } as UserModel),
                },
            });

            expect(
                screen.getByText('Account access restricted due to unpaid invoices. Please contact your administrator.')
            ).toBeInTheDocument();
        }
    );
});

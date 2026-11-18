import { render } from '@testing-library/react';

import { usePaymentMethods } from '@proton/account/paymentMethods/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { mockUseUser } from '@proton/account/testing/vitest/mockUseUser';
import Loader from '@proton/components/components/loader/Loader';
import useModals from '@proton/components/hooks/useModals';
import { applyHOCs } from '@proton/components/testing/hocs/helpers';
import { withEventManager } from '@proton/components/testing/vitest/with-event-manager';
import { withReduxStore } from '@proton/components/testing/vitest/with-redux-store';
import { defaultProtonConfig, withConfig } from '@proton/components/testing/with-config';
import { FREE_SUBSCRIPTION, PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import { APPS } from '@proton/shared/lib/constants';

import PaymentMethodsSection from './PaymentMethodsSection';
import PaymentMethodsTable from './PaymentMethodsTable';

vi.mock('@proton/account/paymentMethods/hooks');
vi.mock('@proton/account/subscription/hooks');
vi.mock('@proton/components/hooks/useModals', () => ({
    default: vi.fn().mockReturnValue({ createModal: vi.fn() }),
}));

vi.mock('@proton/components/components/loader/Loader');
vi.mock('./PaymentMethodsTable');

const PaymentMethodsSectionContext = applyHOCs(
    withEventManager(),
    withConfig({
        ...defaultProtonConfig,
        APP_NAME: 'proton-vpn-settings',
    }),
    withReduxStore()
)(PaymentMethodsSection);

describe('PaymentMethodsSection', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        mockUseUser();
        vi.mocked(usePaymentMethods).mockReturnValue([[], false]);
        vi.mocked(useSubscription).mockReturnValue([FREE_SUBSCRIPTION as any, false]);
        vi.mocked(useModals).mockReturnValue({
            createModal: vi.fn(),
        } as any);

        vi.mocked(Loader).mockImplementation(() => <>Loader</>);
        vi.mocked(PaymentMethodsTable).mockImplementation(() => <>PaymentMethodsTable</>);
    });

    it('should render <Loading> if payment methods are loading', () => {
        const usePaymentMethodsMock = vi.mocked(usePaymentMethods);
        usePaymentMethodsMock.mockReturnValue([[], true]);

        const { container } = render(<PaymentMethodsSectionContext app={APPS.PROTONMAIL} />);

        expect(container).toHaveTextContent('Loader');
    });

    it('should render <Loading> if subscriptions are loading', () => {
        vi.mocked(useSubscription).mockReturnValue([undefined as any, true]);

        const { container } = render(<PaymentMethodsSectionContext app={APPS.PROTONMAIL} />);

        expect(container).toHaveTextContent('Loader');
    });

    it('should render the main contanet otherwise', () => {
        const { container } = render(<PaymentMethodsSectionContext app={APPS.PROTONMAIL} />);

        expect(container).toHaveTextContent('PaymentMethodsTable');
    });

    it('should show the paypal button only if there is not paypal payment yet', () => {
        const { container } = render(<PaymentMethodsSectionContext app={APPS.PROTONMAIL} />);
        expect(container).toHaveTextContent('Add PayPal');
    });

    it('should NOT show the paypal button only if there is already paypal payment', () => {
        vi.mocked(usePaymentMethods).mockReturnValue([
            [
                {
                    Order: 1,
                    ID: 'id123',
                    Type: PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
                    Details: {
                        BillingAgreementID: 'BillingAgreementID123',
                        PayerID: 'PayerID123',
                        Payer: 'Arthur Morgan',
                    },
                },
            ],
            false,
        ]);

        const { container } = render(<PaymentMethodsSectionContext app={APPS.PROTONMAIL} />);
        expect(container).not.toHaveTextContent('Add PayPal');
    });
});

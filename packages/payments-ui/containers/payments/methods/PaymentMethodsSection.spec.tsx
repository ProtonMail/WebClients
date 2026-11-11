import { render } from '@testing-library/react';

import { usePaymentMethods } from '@proton/account/paymentMethods/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { mockUseUser } from '@proton/account/testing/mockUseUser';
import Loader from '@proton/components/components/loader/Loader';
import useModals from '@proton/components/hooks/useModals';
import { applyHOCs } from '@proton/components/testing/hocs/helpers';
import { defaultProtonConfig, withConfig } from '@proton/components/testing/with-config';
import { withEventManager } from '@proton/components/testing/with-event-manager';
import { withReduxStore } from '@proton/components/testing/with-redux-store';
import { FREE_SUBSCRIPTION, PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import { APPS } from '@proton/shared/lib/constants';

import PaymentMethodsSection from './PaymentMethodsSection';
import PaymentMethodsTable from './PaymentMethodsTable';

jest.mock('@proton/account/paymentMethods/hooks');
jest.mock('@proton/account/subscription/hooks');
jest.mock('@proton/components/hooks/useModals');

jest.mock('@proton/components/components/loader/Loader');
jest.mock('./PaymentMethodsTable');

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
        jest.resetAllMocks();
        mockUseUser();
        jest.mocked(usePaymentMethods).mockReturnValue([[], false]);
        jest.mocked(useSubscription).mockReturnValue([FREE_SUBSCRIPTION as any, false]);
        jest.mocked(useModals).mockReturnValue({
            createModal: jest.fn(),
        } as any);

        jest.mocked(Loader).mockImplementation(() => <>Loader</>);
        jest.mocked(PaymentMethodsTable).mockImplementation(() => <>PaymentMethodsTable</>);
    });

    it('should render <Loading> if payment methods are loading', () => {
        const usePaymentMethodsMock = jest.mocked(usePaymentMethods);
        usePaymentMethodsMock.mockReturnValue([[], true]);

        const { container } = render(<PaymentMethodsSectionContext app={APPS.PROTONMAIL} />);

        expect(container).toHaveTextContent('Loader');
    });

    it('should render <Loading> if subscriptions are loading', () => {
        jest.mocked(useSubscription).mockReturnValue([undefined as any, true]);

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
        jest.mocked(usePaymentMethods).mockReturnValue([
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

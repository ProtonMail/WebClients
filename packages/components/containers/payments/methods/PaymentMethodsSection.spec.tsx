import { render } from '@testing-library/react';

import { usePaymentMethods } from '@proton/account/paymentMethods/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import Loader from '@proton/components/components/loader/Loader';
import { FREE_SUBSCRIPTION, MethodStorage, PAYMENT_METHOD_TYPES } from '@proton/payments';
import { APPS } from '@proton/shared/lib/constants';
import { applyHOCs, defaultProtonConfig, withConfig, withEventManager, withReduxStore } from '@proton/testing';
import { mockUseUser } from '@proton/testing/lib/mockUseUser';

import useModals from '../../../hooks/__mocks__/useModals';
import PaymentMethodsSection from './PaymentMethodsSection';
import PaymentMethodsTable from './PaymentMethodsTable';

jest.mock('@proton/account/paymentMethods/hooks');
jest.mock('@proton/account/subscription/hooks');
jest.mock('../../../hooks/useModals');

jest.mock('../../../components/loader/Loader');
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
                    Type: PAYMENT_METHOD_TYPES.PAYPAL,
                    Details: {
                        BillingAgreementID: 'BillingAgreementID123',
                        PayerID: 'PayerID123',
                        Payer: 'Arthur Morgan',
                    },
                    External: MethodStorage.INTERNAL,
                },
            ],
            false,
        ]);

        const { container } = render(<PaymentMethodsSectionContext app={APPS.PROTONMAIL} />);
        expect(container).not.toHaveTextContent('Add PayPal');
    });

    it('should NOT show the paypal button only if there is already paypal payment', () => {
        jest.mocked(usePaymentMethods).mockReturnValue([
            [
                {
                    Order: 1,
                    ID: 'id123',
                    Type: PAYMENT_METHOD_TYPES.PAYPAL,
                    Details: {
                        BillingAgreementID: 'BillingAgreementID123',
                        PayerID: 'PayerID123',
                        Payer: 'Arthur Morgan',
                    },
                    External: MethodStorage.EXTERNAL,
                },
            ],
            false,
        ]);

        const { container } = render(<PaymentMethodsSectionContext app={APPS.PROTONMAIL} />);
        expect(container).not.toHaveTextContent('Add PayPal');
    });
});

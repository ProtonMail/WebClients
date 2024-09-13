import { render } from '@testing-library/react';

import { MethodStorage, PAYMENT_METHOD_TYPES } from '@proton/payments';
import { FREE_SUBSCRIPTION } from '@proton/shared/lib/constants';
import { applyHOCs, mockUseUser, withEventManager } from '@proton/testing';

import { Loader } from '../../../components';
import { usePaymentMethods, useSubscription } from '../../../hooks';
import useModals from '../../../hooks/__mocks__/useModals';
import { MozillaInfoPanel } from '../../account';
import PaymentMethodsSection from './PaymentMethodsSection';
import PaymentMethodsTable from './PaymentMethodsTable';

jest.mock('../../../hooks/useConfig', () => () => ({
    APP_NAME: 'proton-vpn-settings',
}));

jest.mock('../../../hooks/usePaymentMethods');
jest.mock('../../../hooks/useSubscription');
jest.mock('../../../hooks/useModals');

jest.mock('../../../components/loader/Loader');
jest.mock('../../account/MozillaInfoPanel');
jest.mock('./PaymentMethodsTable');

const PaymentMethodsSectionContext = applyHOCs(withEventManager())(PaymentMethodsSection);

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
        jest.mocked(MozillaInfoPanel).mockImplementation(() => <>MozillaInfoPanel</>);
        jest.mocked(PaymentMethodsTable).mockImplementation(() => <>PaymentMethodsTable</>);
    });

    it('should render <Loading> if payment methods are loading', () => {
        const usePaymentMethodsMock = jest.mocked(usePaymentMethods);
        usePaymentMethodsMock.mockReturnValue([[], true]);

        const { container } = render(<PaymentMethodsSectionContext />);

        expect(container).toHaveTextContent('Loader');
    });

    it('should render <Loading> if subscriptions are loading', () => {
        jest.mocked(useSubscription).mockReturnValue([undefined as any, true]);

        const { container } = render(<PaymentMethodsSectionContext />);

        expect(container).toHaveTextContent('Loader');
    });

    it('should render <MozillaInfoPanel> if subscription is managed by mozilla', () => {
        jest.mocked(useSubscription).mockReturnValue([{ isManagedByMozilla: true } as any, false]);

        const { container } = render(<PaymentMethodsSectionContext />);

        expect(container).toHaveTextContent('MozillaInfoPanel');
    });

    it('should render the main contanet otherwise', () => {
        const { container } = render(<PaymentMethodsSectionContext />);

        expect(container).toHaveTextContent('PaymentMethodsTable');
    });

    it('should show the paypal button only if there is not paypal payment yet', () => {
        const { container } = render(<PaymentMethodsSectionContext />);
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

        const { container } = render(<PaymentMethodsSectionContext />);
        expect(container).not.toHaveTextContent('Add PayPal');
    });
});

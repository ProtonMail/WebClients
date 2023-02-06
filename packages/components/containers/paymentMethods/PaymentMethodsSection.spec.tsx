import { render } from '@testing-library/react';

import { FREE_SUBSCRIPTION, PAYMENT_METHOD_TYPES } from '@proton/shared/lib/constants';

import {
    Loader,
    MozillaInfoPanel,
    PaymentMethodsSection,
    PaymentMethodsTable,
    useModals,
    usePaymentMethods,
    useSubscription,
    useTypedSubscription,
} from '../..';

jest.mock('../../hooks/useConfig', () => () => ({
    APP_NAME: 'proton-vpn-settings',
}));

jest.mock('../../hooks/usePaymentMethods');
jest.mock('../../hooks/useSubscription');
jest.mock('../../hooks/useModals');

jest.mock('../../components/loader/Loader');
jest.mock('../account/MozillaInfoPanel');
jest.mock('./PaymentMethodsTable');

describe('PaymentMethodsSection', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        jest.mocked(usePaymentMethods).mockReturnValue([[], false, undefined as any]);
        jest.mocked(useSubscription).mockReturnValue([{} as any, false, undefined as any]);
        jest.mocked(useTypedSubscription).mockReturnValue([FREE_SUBSCRIPTION, false]);
        jest.mocked(useModals).mockReturnValue({
            createModal: jest.fn(),
        } as any);

        jest.mocked(Loader).mockImplementation(() => <>Loader</>);
        jest.mocked(MozillaInfoPanel).mockImplementation(() => <>MozillaInfoPanel</>);
        jest.mocked(PaymentMethodsTable).mockImplementation(() => <>PaymentMethodsTable</>);
    });

    it('should render <Loading> if payment methods are loading', () => {
        const usePaymentMethodsMock = jest.mocked(usePaymentMethods);
        usePaymentMethodsMock.mockReturnValue([[], true, undefined as any]);

        const { container } = render(<PaymentMethodsSection />);

        expect(container).toHaveTextContent('Loader');
    });

    it('should render <Loading> if subscriptions are loading', () => {
        jest.mocked(useTypedSubscription).mockReturnValue([undefined, true]);

        const { container } = render(<PaymentMethodsSection />);

        expect(container).toHaveTextContent('Loader');
    });

    it('should render <MozillaInfoPanel> if subscription is managed by mozilla', () => {
        jest.mocked(useTypedSubscription).mockReturnValue([{ isManagedByMozilla: true } as any, false]);

        const { container } = render(<PaymentMethodsSection />);

        expect(container).toHaveTextContent('MozillaInfoPanel');
    });

    it('should render the main contanet otherwise', () => {
        const { container } = render(<PaymentMethodsSection />);

        expect(container).toHaveTextContent('PaymentMethodsTable');
    });

    it('should show the paypal button only if there is not paypal payment yet', () => {
        const { container } = render(<PaymentMethodsSection />);
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
                },
            ],
            false,
            undefined as any,
        ]);

        const { container } = render(<PaymentMethodsSection />);
        expect(container).not.toHaveTextContent('Add PayPal');
    });
});

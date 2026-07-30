import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import useApi from '@proton/components/hooks/useApi';
import useEventManager from '@proton/components/hooks/useEventManager';
import useModals from '@proton/components/hooks/useModals';
import useNotifications from '@proton/components/hooks/useNotifications';
import { deletePaymentMethod, orderPaymentMethods } from '@proton/payments/core/api/api';
import { Autopay, PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import type { SavedPaymentMethod } from '@proton/payments/core/interface';
import { APPS } from '@proton/shared/lib/constants';
import { mockUseSubscription } from '@proton/testing/lib/mockUseSubscription';
import { mockUseUser } from '@proton/testing/lib/mockUseUser';

import PaymentMethodActions from './PaymentMethodActions';

jest.mock('../../../hooks/useNotifications', () =>
    jest.fn().mockReturnValue({
        createNotification: jest.fn(),
    })
);

jest.mock('../../../hooks/useModals', () =>
    jest.fn().mockReturnValue({
        createModal: jest.fn(),
    })
);

jest.mock('../../../hooks/useEventManager', () =>
    jest.fn().mockReturnValue({
        call: jest.fn(),
    })
);

jest.mock('@proton/components/hooks/useApi', () => jest.fn().mockReturnValue(jest.fn()));

// The real DropdownActions renders its overflow actions inside a Portal-backed dropdown.
// Mocking Portal to render its children inline lets us exercise the real component.
jest.mock('@proton/components/components/portal/Portal');

jest.mock('@proton/payments/ui/containers/EditCardModal', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => <span>Edit Card Modal</span>),
}));

beforeEach(() => {
    mockUseUser();
    mockUseSubscription();
});

const openActionsDropdown = async () => {
    const toggle = screen.queryByTestId('dropdownActions:dropdown');
    if (toggle) {
        await userEvent.click(toggle);
    }
};

describe('PaymentMethodActions', () => {
    it('should show only delete button if paypal is the first method', async () => {
        const method: SavedPaymentMethod = {
            Order: 1,
            ID: 'id-123',
            Type: PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
            Details: {
                BillingAgreementID: 'agreement-123',
                PayerID: 'payer-123',
                Payer: 'payer-123',
            },
            IsDefault: true,
        };

        const { container } = render(<PaymentMethodActions method={method} methods={[method]} app={APPS.PROTONMAIL} />);
        await openActionsDropdown();

        expect(container).not.toHaveTextContent('Edit');
        expect(container).not.toHaveTextContent('Mark as default');
        expect(container).toHaveTextContent('Delete');
    });

    it('should show "delete" and "mark as default" button if paypal is not the first', async () => {
        const method: SavedPaymentMethod = {
            Order: 1,
            ID: 'id-123',
            Type: PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
            Details: {
                BillingAgreementID: 'agreement-123',
                PayerID: 'payer-123',
                Payer: 'payer-123',
            },
        };

        render(<PaymentMethodActions method={method} methods={[method]} app={APPS.PROTONMAIL} />);
        await openActionsDropdown();

        expect(screen.queryByText('Edit')).not.toBeInTheDocument();
        expect(await screen.findByText('Mark as default')).toBeInTheDocument();
        expect(await screen.findByText('Delete')).toBeInTheDocument();
    });

    it('should show Edit, Default and Delete buttons for non-first card', async () => {
        const method: SavedPaymentMethod = {
            Order: 1,
            ID: 'id-123',
            Type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
            Details: {
                Name: 'John Smith',
                ExpMonth: '01',
                ExpYear: '2038',
                ZIP: '12345',
                Country: 'US',
                Last4: '4444',
                Brand: 'Mastercard',
            },
            Autopay: Autopay.ENABLE,
        };

        render(<PaymentMethodActions method={method} methods={[method]} app={APPS.PROTONMAIL} />);
        await openActionsDropdown();

        expect(await screen.findByText('Edit')).toBeInTheDocument();
        expect(await screen.findByText('Mark as default')).toBeInTheDocument();
        expect(await screen.findByText('Delete')).toBeInTheDocument();
    });

    it('should show Edit and Delete buttons for first card', async () => {
        const method: SavedPaymentMethod = {
            Order: 1,
            ID: 'id-123',
            Type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
            Details: {
                Name: 'John Smith',
                ExpMonth: '01',
                ExpYear: '2038',
                ZIP: '12345',
                Country: 'US',
                Last4: '4444',
                Brand: 'Mastercard',
            },
            Autopay: Autopay.ENABLE,
            IsDefault: true,
        };

        render(<PaymentMethodActions method={method} methods={[method]} app={APPS.PROTONMAIL} />);
        await openActionsDropdown();

        expect(await screen.findByText('Edit')).toBeInTheDocument();
        expect(screen.queryByText('Mark as default')).not.toBeInTheDocument();
        expect(await screen.findByText('Delete')).toBeInTheDocument();
    });

    describe('action handlers', () => {
        it('should open EditCardModal on Edit', async () => {
            const method: SavedPaymentMethod = {
                Order: 1,
                ID: 'id-123',
                Type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
                Details: {
                    Name: 'John Smith',
                    ExpMonth: '01',
                    ExpYear: '2038',
                    ZIP: '12345',
                    Country: 'US',
                    Last4: '4444',
                    Brand: 'Mastercard',
                },
                Autopay: Autopay.ENABLE,
            };

            render(<PaymentMethodActions method={method} methods={[method]} app={APPS.PROTONMAIL} />);

            await userEvent.click(await screen.findByTestId('Edit'));

            expect(await screen.findByText('Edit Card Modal')).toBeInTheDocument();
        });

        it('should make an API call on Mark as Default', async () => {
            const method0: SavedPaymentMethod = {
                Order: 0,
                ID: 'id-000',
                Type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
                Details: {
                    Name: 'John Smith',
                    ExpMonth: '01',
                    ExpYear: '2055',
                    ZIP: '12345',
                    Country: 'US',
                    Last4: '4242',
                    Brand: 'Visa',
                },
                Autopay: Autopay.ENABLE,
                IsDefault: true,
            };

            const method1: SavedPaymentMethod = {
                Order: 1,
                ID: 'id-123',
                Type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
                Details: {
                    Name: 'John Smith',
                    ExpMonth: '01',
                    ExpYear: '2038',
                    ZIP: '12345',
                    Country: 'US',
                    Last4: '4444',
                    Brand: 'Mastercard',
                },
                Autopay: Autopay.ENABLE,
                IsDefault: false,
            };

            const api = useApi();
            (api as jest.Mock).mockReset();

            const { call } = useEventManager();
            (call as jest.Mock).mockReset();

            const { createNotification } = useNotifications();
            (createNotification as jest.Mock).mockReset();

            render(<PaymentMethodActions method={method1} methods={[method0, method1]} app={APPS.PROTONMAIL} />);

            await openActionsDropdown();
            await userEvent.click(await screen.findByText('Mark as default'));

            await waitFor(async () => {
                expect(api).toHaveBeenCalledWith(orderPaymentMethods(['id-123', 'id-000'])); // a request to change the order of the payment methods
            });
            await waitFor(async () => {
                expect(call).toHaveBeenCalled();
            });
            await waitFor(async () => {
                expect(createNotification).toHaveBeenCalled();
            });
        });

        it('should open ConfirmModal on Delete', async () => {
            const method: SavedPaymentMethod = {
                Order: 1,
                ID: 'id-123',
                Type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
                Details: {
                    Name: 'John Smith',
                    ExpMonth: '01',
                    ExpYear: '2038',
                    ZIP: '12345',
                    Country: 'US',
                    Last4: '4444',
                    Brand: 'Mastercard',
                },
                Autopay: Autopay.ENABLE,
            };
            const { createModal } = useModals();
            (createModal as jest.Mock).mockReset();

            const api = useApi();
            (api as jest.Mock).mockReset();

            const { call } = useEventManager();
            (call as jest.Mock).mockReset();

            const { createNotification } = useNotifications();
            (createNotification as jest.Mock).mockReset();

            render(<PaymentMethodActions method={method} methods={[method]} app={APPS.PROTONMAIL} />);

            await openActionsDropdown();
            await userEvent.click(await screen.findByTestId('Delete'));
            await userEvent.click(await screen.findByTestId('confirm-deletion'));

            await waitFor(async () => {
                expect(api).toHaveBeenCalledWith(deletePaymentMethod('id-123'));
            });
            await waitFor(async () => {
                expect(call).toHaveBeenCalled();
            });
            await waitFor(async () => {
                expect(createNotification).toHaveBeenCalled();
            });
        });
    });
});

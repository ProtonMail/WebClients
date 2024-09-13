// import { fireEvent, waitFor } from '@testing-library/react';

// import { Autopay, CardModel } from '@proton/payments';
// import { updatePaymentMethod } from '@proton/shared/lib/api/payments';
// import {
//     apiMock,
//     applyHOCs,
//     withApi,
//     withCache,
//     withDeprecatedModals,
//     withEventManager,
//     withNotifications,
// } from '@proton/testing';

// import { renderWithProviders } from '../contacts/tests/render';
// import EditCardModal from './EditCardModal';

// jest.mock('@proton/components/components/portal/Portal');
// jest.mock('@proton/components/components/toggle/Toggle');

// const defaultCard: CardModel = {
//     number: '',
//     month: '',
//     year: '',
//     cvc: '',
//     zip: '',
//     country: 'US',
// };

// beforeEach(() => {
//     jest.clearAllMocks();
// });

// const ContextEditCardModal = applyHOCs(
//     withNotifications(),
//     withEventManager(),
//     withApi(),
//     withCache(),
//     withDeprecatedModals()
// )(EditCardModal);

// it('should render', () => {
//     const { container } = renderWithProviders(<ContextEditCardModal open={true} />);

//     expect(container).not.toBeEmptyDOMElement();
// });

// it('should update Autopay and close modal if user edits the existing payment method', async () => {
//     const paymentMethodId = 'paymentMethodId123';
//     const onClose = jest.fn();
//     const { getByTestId } = renderWithProviders(
//         <ContextEditCardModal
//             card={defaultCard}
//             renewState={Autopay.DISABLE}
//             paymentMethodId={paymentMethodId}
//             open={true}
//             onClose={onClose}
//         />
//     );

//     fireEvent.click(getByTestId('toggle-subscription-renew'));

//     await waitFor(() => {
//         expect(apiMock).toHaveBeenCalledWith(updatePaymentMethod(paymentMethodId, { Autopay: Autopay.ENABLE }));
//     });
//     await waitFor(() => {
//         expect(onClose).toHaveBeenCalled();
//     });
// });

// it('should update Autopay and close modal if user edits the existing payment method (toggle off)', async () => {
//     const paymentMethodId = 'paymentMethodId123';
//     const onClose = jest.fn();
//     const { getByTestId } = renderWithProviders(
//         <ContextEditCardModal
//             card={defaultCard}
//             renewState={Autopay.ENABLE}
//             paymentMethodId={paymentMethodId}
//             open={true}
//             onClose={onClose}
//         />
//     );

//     fireEvent.click(getByTestId('toggle-subscription-renew'));
//     fireEvent.click(getByTestId('action-disable-autopay'));

//     await waitFor(() => {
//         expect(apiMock).toHaveBeenCalledWith(updatePaymentMethod(paymentMethodId, { Autopay: Autopay.DISABLE }));
//     });
//     await waitFor(() => {
//         expect(onClose).toHaveBeenCalled();
//     });
// });

// it('should not update autopay if this is Add Credit card mode', async () => {
//     const onClose = jest.fn();
//     const { getByTestId } = renderWithProviders(<ContextEditCardModal open={true} onClose={onClose} />);

//     fireEvent.click(getByTestId('toggle-subscription-renew'));
//     fireEvent.click(getByTestId('action-disable-autopay'));

//     await waitFor(() => {});

//     expect(apiMock).not.toHaveBeenCalled();
//     expect(onClose).not.toHaveBeenCalled();
// });

// it('should toggle back if API returned error', async () => {
//     apiMock.mockRejectedValue(new Error());

//     const paymentMethodId = 'paymentMethodId123';
//     const onClose = jest.fn();
//     const { getByTestId } = renderWithProviders(
//         <ContextEditCardModal
//             card={defaultCard}
//             renewState={Autopay.DISABLE}
//             paymentMethodId={paymentMethodId}
//             open={true}
//             onClose={onClose}
//         />
//     );

//     fireEvent.click(getByTestId('toggle-subscription-renew'));

//     await waitFor(() => {
//         expect(apiMock).toHaveBeenCalledWith(updatePaymentMethod(paymentMethodId, { Autopay: Autopay.ENABLE }));
//     });
//     await waitFor(() => {
//         expect(onClose).not.toHaveBeenCalled();
//     });
//     await waitFor(() => {
//         expect(getByTestId('toggle-subscription-renew')).not.toHaveTextContent('CHECKED');
//     });
// });

// it('should disable Save button while updating the toggle status', async () => {
//     let resolve!: () => void;
//     const manualPromise = new Promise<void>((innerResolve) => (resolve = innerResolve));
//     apiMock.mockReturnValue(manualPromise);

//     const paymentMethodId = 'paymentMethodId123';
//     const onClose = jest.fn();
//     const { getByTestId } = renderWithProviders(
//         <ContextEditCardModal
//             card={defaultCard}
//             renewState={Autopay.DISABLE}
//             paymentMethodId={paymentMethodId}
//             open={true}
//             onClose={onClose}
//         />
//     );

//     fireEvent.click(getByTestId('toggle-subscription-renew'));
//     await waitFor(() => {
//         expect(getByTestId('edit-card-action-save')).toHaveAttribute('disabled');
//     });

//     resolve();
//     await waitFor(() => {
//         expect(getByTestId('edit-card-action-save')).not.toHaveAttribute('disabled');
//     });
// });

it('placeholder', () => expect(true).toBeTruthy());
